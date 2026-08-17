const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const neo4j = require("neo4j-driver");

dotenv.config();

const app = express();

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());
app.use(express.json());

// ======================================================
// COGNITODB / NEO4J CONNECTION
// ======================================================

const driver = neo4j.driver(
  process.env.COGNODB_URI,
  neo4j.auth.basic(
    process.env.COGNODB_USERNAME,
    process.env.COGNODB_PASSWORD
  )
);

// ======================================================
// BASIC TEST
// ======================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "WEXA Backend + CognitoDB is running 🚀",
  });
});

// ======================================================
// DATABASE TEST
// ======================================================

app.get("/api/database-test", async (req, res) => {
  const session = driver.session();

  try {
    await session.run("RETURN 1 AS test");

    res.json({
      success: true,
      message: "CognitoDB connection successful",
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      success: false,
      message: "CognitoDB connection failed",
      error: error.message,
    });
  } finally {
    await session.close();
  }
});

// ======================================================
// SAVE CONSTRUCTION ESTIMATE
// ======================================================

app.post("/api/estimates", async (req, res) => {
  const { area, budget, estimate } = req.body;

  if (!area || !estimate) {
    return res.status(400).json({
      success: false,
      message: "Area and estimate are required",
    });
  }

  const session = driver.session();

  try {
    const result = await session.run(
      `
      CREATE (e:Estimate {
        area: $area,
        budget: $budget,
        estimate: $estimate,
        createdAt: datetime()
      })

      RETURN
        e.area AS area,
        e.budget AS budget,
        e.estimate AS estimate,
        e.createdAt AS createdAt
      `,
      {
        area: Number(area),
        budget: Number(budget || 0),
        estimate: Number(estimate),
      }
    );

    const record = result.records[0];

    res.json({
      success: true,
      message: "Estimate saved successfully",
      estimate: {
        area: record.get("area"),
        budget: record.get("budget"),
        estimate: record.get("estimate"),
        createdAt: record.get("createdAt").toString(),
      },
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      success: false,
      message: "Could not save estimate",
      error: error.message,
    });
  } finally {
    await session.close();
  }
});

// ======================================================
// GET ALL PROJECTS
// ======================================================

app.get("/api/projects", async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (p:Project)

      OPTIONAL MATCH (p)-[:LOCATED_IN]->(location:Location)

      OPTIONAL MATCH (p)-[:HAS_ESTIMATE]->(estimate:Estimate)

      RETURN
        p.name AS name,
        p.area AS area,
        p.progress AS progress,
        location.name AS location,
        estimate.budget AS budget,
        estimate.estimate AS estimate,
        estimate.status AS status

      ORDER BY p.name
    `);

    const projects = result.records.map((record) => ({
      name: record.get("name"),
      area: record.get("area"),
      progress: record.get("progress"),
      location: record.get("location"),
      budget: record.get("budget"),
      estimate: record.get("estimate"),
      status: record.get("status"),
    }));

    res.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Projects error:", error);

    res.status(500).json({
      success: false,
      message: "Could not retrieve projects",
      error: error.message,
    });
  } finally {
    await session.close();
  }
});

// ======================================================
// GET PROJECT DETAILS
// ======================================================

app.get("/api/projects/:projectName", async (req, res) => {
  const { projectName } = req.params;

  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (p:Project {name: $projectName})

      OPTIONAL MATCH (p)-[:LOCATED_IN]->(location:Location)

      OPTIONAL MATCH (p)-[:HAS_ESTIMATE]->(e:Estimate)

      RETURN
        p.name AS name,
        p.area AS area,
        p.progress AS progress,
        location.name AS location,
        e.budget AS budget,
        e.estimate AS estimate,
        e.status AS status
      `,
      {
        projectName,
      }
    );

    if (result.records.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const record = result.records[0];

    res.json({
      success: true,
      project: {
        name: record.get("name"),
        area: record.get("area"),
        progress: record.get("progress"),
        location: record.get("location"),
        budget: record.get("budget"),
        estimate: record.get("estimate"),
        status: record.get("status"),
      },
    });
  } catch (error) {
    console.error("Project details error:", error);

    res.status(500).json({
      success: false,
      message: "Could not retrieve project",
      error: error.message,
    });
  } finally {
    await session.close();
  }
});

// ======================================================
// GET PROJECT MATERIALS
// ======================================================

app.get("/api/projects/:projectName/materials", async (req, res) => {
  const { projectName } = req.params;

  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (p:Project {name: $projectName})
            -[:USES_MATERIAL]->(m:Material)

      RETURN
        m.name AS name,
        m.category AS category,
        m.unit AS unit,
        m.price AS price

      ORDER BY m.name
      `,
      {
        projectName,
      }
    );

    const materials = result.records.map((record) => ({
      name: record.get("name"),
      category: record.get("category"),
      unit: record.get("unit"),
      price: record.get("price"),
    }));

    res.json({
      success: true,
      project: projectName,
      materials,
    });
  } catch (error) {
    console.error("Materials error:", error);

    res.status(500).json({
      success: false,
      message: "Could not retrieve materials",
      error: error.message,
    });
  } finally {
    await session.close();
  }
});

// ======================================================
// GET ALL MATERIALS
// ======================================================

app.get("/api/materials", async (req, res) => {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (m:Material)

      OPTIONAL MATCH (m)-[:SUPPLIED_BY]->(s:Supplier)

      RETURN
        m.name AS name,
        m.category AS category,
        m.unit AS unit,
        m.price AS price,
        collect(DISTINCT {
          name: s.name,
          phone: s.phone
        }) AS suppliers

      ORDER BY m.name
    `);

    const materials = result.records.map((record) => ({
      name: record.get("name"),
      category: record.get("category"),
      unit: record.get("unit"),
      price: record.get("price"),
      suppliers: record.get("suppliers"),
    }));

    res.json({
      success: true,
      materials,
    });
  } catch (error) {
    console.error("All materials error:", error);

    res.status(500).json({
      success: false,
      message: "Could not retrieve materials",
      error: error.message,
    });
  } finally {
    await session.close();
  }
});

// ======================================================
// PROJECT → MATERIAL → SUPPLIER
// ======================================================

app.get(
  "/api/projects/:projectName/material-suppliers",
  async (req, res) => {
    const { projectName } = req.params;

    const session = driver.session();

    try {
      const result = await session.run(
        `
        MATCH (p:Project {name: $projectName})
              -[:USES_MATERIAL]->(m:Material)
              -[:SUPPLIED_BY]->(s:Supplier)

        RETURN
          p.name AS project,
          m.name AS material,
          m.category AS category,
          m.unit AS unit,
          m.price AS price,
          s.name AS supplier,
          s.phone AS phone

        ORDER BY m.name
        `,
        {
          projectName,
        }
      );

      const materials = result.records.map((record) => ({
        project: record.get("project"),
        material: record.get("material"),
        category: record.get("category"),
        unit: record.get("unit"),
        price: record.get("price"),
        supplier: record.get("supplier"),
        phone: record.get("phone"),
      }));

      res.json({
        success: true,
        project: projectName,
        materials,
      });
    } catch (error) {
      console.error("Graph traversal error:", error);

      res.status(500).json({
        success: false,
        message: "Could not retrieve material and supplier information",
        error: error.message,
      });
    } finally {
      await session.close();
    }
  }
);

// ======================================================
// GET SUPPLIERS FOR PROJECT
// ======================================================

app.get(
  "/api/projects/:projectName/suppliers",
  async (req, res) => {
    const { projectName } = req.params;

    const session = driver.session();

    try {
      const result = await session.run(
        `
        MATCH (p:Project {name: $projectName})
              -[:USES_MATERIAL]->(m:Material)
              -[:SUPPLIED_BY]->(s:Supplier)

        RETURN DISTINCT
          s.name AS name,
          s.phone AS phone

        ORDER BY s.name
        `,
        {
          projectName,
        }
      );

      const suppliers = result.records.map((record) => ({
        name: record.get("name"),
        phone: record.get("phone"),
      }));

      res.json({
        success: true,
        suppliers,
      });
    } catch (error) {
      console.error("Supplier query error:", error);

      res.status(500).json({
        success: false,
        message: "Could not retrieve suppliers",
        error: error.message,
      });
    } finally {
      await session.close();
    }
  }
);

// ======================================================
// RELATED PROJECTS
// ======================================================

app.get(
  "/api/projects/:projectName/related",
  async (req, res) => {
    const { projectName } = req.params;

    const session = driver.session();

    try {
      const result = await session.run(
        `
        MATCH (p:Project {name: $projectName})
              -[:USES_MATERIAL]->(m:Material)
              <-[:USES_MATERIAL]-(related:Project)

        WHERE related.name <> $projectName

        RETURN DISTINCT
          related.name AS name,
          related.area AS area,
          related.progress AS progress

        ORDER BY related.name
        `,
        {
          projectName,
        }
      );

      const relatedProjects = result.records.map((record) => ({
        name: record.get("name"),
        area: record.get("area"),
        progress: record.get("progress"),
      }));

      res.json({
        success: true,
        relatedProjects,
      });
    } catch (error) {
      console.error("Related projects error:", error);

      res.status(500).json({
        success: false,
        message: "Could not retrieve related projects",
        error: error.message,
      });
    } finally {
      await session.close();
    }
  }
);

// ======================================================
// WEXA AI ADVISOR
// ======================================================

app.post("/api/ai/advice", async (req, res) => {
  const { question, projectName, area, budget } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({
      success: false,
      message: "Please enter a question.",
    });
  }

  const session = driver.session();

  try {
    // --------------------------------------------------
    // GET PROJECT CONTEXT
    // --------------------------------------------------

    let projectContext = null;
    let materials = [];

    if (projectName) {
      const projectResult = await session.run(
        `
        MATCH (p:Project {name: $projectName})

        OPTIONAL MATCH (p)-[:LOCATED_IN]->(location:Location)

        OPTIONAL MATCH (p)-[:HAS_ESTIMATE]->(e:Estimate)

        RETURN
          p.name AS name,
          p.area AS area,
          p.progress AS progress,
          location.name AS location,
          e.budget AS budget,
          e.estimate AS estimate,
          e.status AS status
        `,
        {
          projectName,
        }
      );

      if (projectResult.records.length > 0) {
        const record = projectResult.records[0];

        projectContext = {
          name: record.get("name"),
          area: record.get("area"),
          progress: record.get("progress"),
          location: record.get("location"),
          budget: record.get("budget"),
          estimate: record.get("estimate"),
          status: record.get("status"),
        };
      }

      const materialResult = await session.run(
        `
        MATCH (p:Project {name: $projectName})
              -[:USES_MATERIAL]->(m:Material)

        RETURN
          m.name AS name,
          m.category AS category,
          m.unit AS unit,
          m.price AS price

        ORDER BY m.name
        `,
        {
          projectName,
        }
      );

      materials = materialResult.records.map((record) => ({
        name: record.get("name"),
        category: record.get("category"),
        unit: record.get("unit"),
        price: record.get("price"),
      }));
    }

    // --------------------------------------------------
    // BASIC WEXA INTELLIGENCE
    // --------------------------------------------------

    const q = question.toLowerCase();

    let answer = "";
    let recommendations = [];

    const constructionArea =
      Number(area) ||
      Number(projectContext?.area) ||
      0;

    const constructionBudget =
      Number(budget) ||
      Number(projectContext?.budget) ||
      0;

    // COST QUESTIONS
    if (
      q.includes("cost") ||
      q.includes("price") ||
      q.includes("estimate") ||
      q.includes("budget")
    ) {
      if (constructionArea > 0) {
        const estimatedCost = constructionArea * 2200;

        answer =
          `Based on the WEXA planning rate of ₹2,200 per sq.ft, ` +
          `${constructionArea.toLocaleString("en-IN")} sq.ft would have ` +
          `an approximate construction cost of ₹${estimatedCost.toLocaleString(
            "en-IN"
          )}.`;

        if (constructionBudget > 0) {
          const difference =
            constructionBudget - estimatedCost;

          if (difference >= 0) {
            recommendations.push(
              `Your budget is approximately ₹${difference.toLocaleString(
                "en-IN"
              )} above the estimated construction cost.`
            );
          } else {
            recommendations.push(
              `Your budget is approximately ₹${Math.abs(
                difference
              ).toLocaleString(
                "en-IN"
              )} below the estimated construction cost.`
            );
          }
        }

        recommendations.push(
          "Keep an additional contingency amount for design changes, site conditions and price fluctuations."
        );
      } else {
        answer =
          "Please provide the built-up area or select a project so WEXA can calculate an approximate construction cost.";
      }
    }

    // MATERIAL QUESTIONS
    else if (
      q.includes("material") ||
      q.includes("cement") ||
      q.includes("steel") ||
      q.includes("brick") ||
      q.includes("tile")
    ) {
      answer =
        "WEXA recommends selecting construction materials based on structural requirements, quality, availability and project budget.";

      if (materials.length > 0) {
        recommendations.push(
          `This project currently uses: ${materials
            .map((m) => m.name)
            .join(", ")}.`
        );
      }

      recommendations.push(
        "Compare supplier pricing and material specifications before purchase."
      );

      recommendations.push(
        "Structural materials should be selected and approved by the responsible engineer."
      );
    }

    // PROJECT QUESTIONS
    else if (
      q.includes("project") ||
      q.includes("progress") ||
      q.includes("analysis")
    ) {
      if (projectContext) {
        answer =
          `${projectContext.name} is currently ${projectContext.progress}% complete. ` +
          `The project is located in ${projectContext.location || "the selected location"} ` +
          `and has a built-up area of ${projectContext.area} sq.ft.`;

        if (projectContext.estimate) {
          recommendations.push(
            `Current recorded estimate: ₹${Number(
              projectContext.estimate
            ).toLocaleString("en-IN")}.`
          );
        }

        recommendations.push(
          "Review progress against the planned budget regularly."
        );
      } else {
        answer =
          "Select a project to allow WEXA to analyze its progress, budget and materials.";
      }
    }

    // SAVING COST
    else if (
      q.includes("reduce") ||
      q.includes("save") ||
      q.includes("cheaper") ||
      q.includes("optimization")
    ) {
      answer =
        "WEXA suggests controlling construction cost through early planning, material comparison and efficient space utilization.";

      recommendations = [
        "Compare multiple suppliers before purchasing major materials.",
        "Avoid unnecessary changes after construction begins.",
        "Optimize the floor plan before starting structural work.",
        "Purchase commonly used materials according to the project schedule.",
        "Maintain a contingency reserve for unexpected expenses.",
      ];
    }

    // HOUSE PLANNING
    else if (
      q.includes("house") ||
      q.includes("plan") ||
      q.includes("room") ||
      q.includes("floor")
    ) {
      answer =
        "For residential planning, WEXA recommends starting with the built-up area, number of bedrooms, parking requirements, circulation and local building requirements.";

      recommendations = [
        "Define the required number of bedrooms and bathrooms.",
        "Reserve adequate space for kitchen and living areas.",
        "Plan natural lighting and ventilation.",
        "Consider parking and service areas.",
        "Have the final plan reviewed by a qualified architect or engineer.",
      ];
    }

    // GENERAL CONSTRUCTION
    else {
      answer =
        "WEXA AI can help with construction cost estimation, project analysis, materials, suppliers, house planning and cost optimization.";

      recommendations = [
        "Ask about construction cost.",
        "Ask about materials.",
        "Ask WEXA to analyze a project.",
        "Ask how to reduce construction cost.",
        "Ask for house planning recommendations.",
      ];
    }

    res.json({
      success: true,
      answer,
      recommendations,
      context: {
        project: projectContext,
        materials,
        area: constructionArea || null,
        budget: constructionBudget || null,
      },
    });
  } catch (error) {
    console.error("WEXA AI error:", error);

    res.status(500).json({
      success: false,
      message: "WEXA AI could not process the request.",
      error: error.message,
    });
  } finally {
    await session.close();
  }
});

// ======================================================
// GRACEFUL SHUTDOWN
// ======================================================

process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down WEXA backend...");

  await driver.close();

  process.exit(0);
});

// ======================================================
// START SERVER
// ======================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("========================================");
  console.log("🚀 WEXA Backend Started");
  console.log(`🌐 http://localhost:${PORT}`);
  console.log("🗄️ CognitoDB connected");
  console.log("🤖 WEXA AI Advisor enabled");
  console.log("========================================");
});