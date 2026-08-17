const dotenv = require("dotenv");
const neo4j = require("neo4j-driver");

dotenv.config();

const driver = neo4j.driver(
  process.env.COGNODB_URI,
  neo4j.auth.basic(
    process.env.COGNODB_USERNAME,
    process.env.COGNODB_PASSWORD
  )
);

async function seedDatabase() {
  const session = driver.session();

  try {
    console.log("🌱 Starting WEXA database seed...");

    // Clear existing demo data
    await session.run(`
      MATCH (n)
      DETACH DELETE n
    `);

    // Create Locations
    await session.run(
      `
      CREATE
        (karimnagar:Location {
          name: $karimnagar
        }),
        (hyderabad:Location {
          name: $hyderabad
        }),
        (warangal:Location {
          name: $warangal
        })
      `,
      {
        karimnagar: "Karimnagar, Telangana",
        hyderabad: "Hyderabad, Telangana",
        warangal: "Warangal, Telangana"
      }
    );

    // Create Suppliers
    await session.run(
      `
      CREATE
        (cementSupplier:Supplier {
          name: $cementSupplier,
          phone: $cementPhone
        }),
        (steelSupplier:Supplier {
          name: $steelSupplier,
          phone: $steelPhone
        }),
        (buildingSupplier:Supplier {
          name: $buildingSupplier,
          phone: $buildingPhone
        })
      `,
      {
        cementSupplier: "ABC Cement Suppliers",
        cementPhone: "9876543210",

        steelSupplier: "Hyderabad Steel Traders",
        steelPhone: "9876543211",

        buildingSupplier: "Telangana Building Materials",
        buildingPhone: "9876543212"
      }
    );

    // Create Materials
    await session.run(
      `
      CREATE
        (cement:Material {
          name: $cement,
          category: $cementCategory,
          unit: $cementUnit,
          price: $cementPrice
        }),
        (steel:Material {
          name: $steel,
          category: $steelCategory,
          unit: $steelUnit,
          price: $steelPrice
        }),
        (bricks:Material {
          name: $bricks,
          category: $bricksCategory,
          unit: $bricksUnit,
          price: $bricksPrice
        }),
        (tiles:Material {
          name: $tiles,
          category: $tilesCategory,
          unit: $tilesUnit,
          price: $tilesPrice
        })
      `,
      {
        cement: "Cement",
        cementCategory: "Structural",
        cementUnit: "Bag",
        cementPrice: 420,

        steel: "Steel",
        steelCategory: "Structural",
        steelUnit: "Kg",
        steelPrice: 75,

        bricks: "Red Bricks",
        bricksCategory: "Masonry",
        bricksUnit: "Piece",
        bricksPrice: 12,

        tiles: "Floor Tiles",
        tilesCategory: "Finishing",
        tilesUnit: "Sq.ft",
        tilesPrice: 65
      }
    );

    // Create Projects
    const projectResult = await session.run(
      `
      CREATE
        (p1:Project {
          name: $p1Name,
          area: $p1Area,
          progress: $p1Progress
        }),
        (p2:Project {
          name: $p2Name,
          area: $p2Area,
          progress: $p2Progress
        }),
        (p3:Project {
          name: $p3Name,
          area: $p3Area,
          progress: $p3Progress
        })
      RETURN p1, p2, p3
      `,
      {
        p1Name: "Modern Family Home",
        p1Area: 2400,
        p1Progress: 68,

        p2Name: "Luxury Villa",
        p2Area: 3200,
        p2Progress: 42,

        p3Name: "Rental Apartments",
        p3Area: 5800,
        p3Progress: 25
      }
    );

    const records = projectResult.records[0];

    const project1 = records.get("p1").elementId;
    const project2 = records.get("p2").elementId;
    const project3 = records.get("p3").elementId;

    // Create Estimates and relationships
    await session.run(
      `
      MATCH
        (p1:Project), (p2:Project), (p3:Project)
      WHERE
        p1.name = $p1Name
        AND p2.name = $p2Name
        AND p3.name = $p3Name

      CREATE
        (e1:Estimate {
          area: 2400,
          budget: 5280000,
          estimate: 5280000,
          status: "In Progress"
        }),
        (e2:Estimate {
          area: 3200,
          budget: 7040000,
          estimate: 7040000,
          status: "In Progress"
        }),
        (e3:Estimate {
          area: 5800,
          budget: 12760000,
          estimate: 12760000,
          status: "Planning"
        })

      CREATE
        (p1)-[:HAS_ESTIMATE]->(e1),
        (p2)-[:HAS_ESTIMATE]->(e2),
        (p3)-[:HAS_ESTIMATE]->(e3)
      `,
      {
        p1Name: "Modern Family Home",
        p2Name: "Luxury Villa",
        p3Name: "Rental Apartments"
      }
    );

    // Connect Projects to Locations
    await session.run(`
      MATCH
        (p1:Project {name: "Modern Family Home"}),
        (p2:Project {name: "Luxury Villa"}),
        (p3:Project {name: "Rental Apartments"}),
        (karimnagar:Location {name: "Karimnagar, Telangana"}),
        (hyderabad:Location {name: "Hyderabad, Telangana"}),
        (warangal:Location {name: "Warangal, Telangana"})

      CREATE
        (p1)-[:LOCATED_IN]->(karimnagar),
        (p2)-[:LOCATED_IN]->(hyderabad),
        (p3)-[:LOCATED_IN]->(warangal)
    `);

    // Connect Projects → Materials
    await session.run(`
      MATCH
        (p1:Project {name: "Modern Family Home"}),
        (p2:Project {name: "Luxury Villa"}),
        (p3:Project {name: "Rental Apartments"}),

        (cement:Material {name: "Cement"}),
        (steel:Material {name: "Steel"}),
        (bricks:Material {name: "Red Bricks"}),
        (tiles:Material {name: "Floor Tiles"})

      CREATE
        (p1)-[:USES_MATERIAL]->(cement),
        (p1)-[:USES_MATERIAL]->(steel),
        (p1)-[:USES_MATERIAL]->(bricks),

        (p2)-[:USES_MATERIAL]->(cement),
        (p2)-[:USES_MATERIAL]->(steel),
        (p2)-[:USES_MATERIAL]->(tiles),

        (p3)-[:USES_MATERIAL]->(cement),
        (p3)-[:USES_MATERIAL]->(bricks),
        (p3)-[:USES_MATERIAL]->(tiles)
    `);

    // Connect Materials → Suppliers
    await session.run(`
      MATCH
        (cement:Material {name: "Cement"}),
        (steel:Material {name: "Steel"}),
        (bricks:Material {name: "Red Bricks"}),
        (tiles:Material {name: "Floor Tiles"}),

        (cementSupplier:Supplier {name: "ABC Cement Suppliers"}),
        (steelSupplier:Supplier {name: "Hyderabad Steel Traders"}),
        (buildingSupplier:Supplier {name: "Telangana Building Materials"})

      CREATE
        (cement)-[:SUPPLIED_BY]->(cementSupplier),
        (steel)-[:SUPPLIED_BY]->(steelSupplier),
        (bricks)-[:SUPPLIED_BY]->(buildingSupplier),
        (tiles)-[:SUPPLIED_BY]->(buildingSupplier)
    `);

    console.log("✅ WEXA graph database seeded successfully!");

  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    await session.close();
    await driver.close();
  }
}

seedDatabase();