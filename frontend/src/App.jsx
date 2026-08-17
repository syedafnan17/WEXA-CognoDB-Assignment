import { useEffect, useState } from "react";

const API = "http://localhost:5000";

function App() {
  const [area, setArea] = useState("");
  const [budget, setBudget] = useState("");
  const [estimate, setEstimate] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [activePage, setActivePage] = useState("Dashboard");

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // AI
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");

  // Materials
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Floor plan
  const [floorPlanMessage, setFloorPlanMessage] = useState("");

  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleNavigation = (page) => {
    setActivePage(page);

    if (page === "Projects") {
      loadProjects();
    }

    if (page === "Materials") {
      loadMaterials();
    }
  };

  // =====================================================
  // LOAD PROJECTS
  // =====================================================

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);

      const response = await fetch(`${API}/api/projects`);
      const data = await response.json();

      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoadingProjects(false);
    }
  };

  // =====================================================
  // LOAD MATERIALS
  // =====================================================

  const loadMaterials = async () => {
    try {
      setLoadingMaterials(true);

      const response = await fetch(`${API}/api/materials`);
      const data = await response.json();

      if (data.success) {
        setMaterials(data.materials || []);
      }
    } catch (error) {
      console.error("Failed to load materials:", error);
    } finally {
      setLoadingMaterials(false);
    }
  };

  // =====================================================
  // BACKEND TEST
  // =====================================================

  useEffect(() => {
    fetch(`${API}/`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Backend connected:", data);
      })
      .catch((error) => {
        console.error("Backend connection failed:", error);
      });

    loadProjects();
    loadMaterials();
  }, []);

  // =====================================================
  // COST ESTIMATOR
  // =====================================================

  const calculateEstimate = async () => {
    const sqft = Number(area);

    if (!sqft || sqft <= 0) {
      alert("Please enter a valid built-up area.");
      return;
    }

    const rate = 2200;
    const total = sqft * rate;

    setEstimate(total);

    try {
      setSaving(true);
      setSaveMessage("");

      const response = await fetch(`${API}/api/estimates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          area: sqft,
          budget: budget ? Number(budget) : 0,
          estimate: total,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to save estimate"
        );
      }

      setSaveMessage("Estimate saved successfully ✓");
    } catch (error) {
      console.error("Failed to save estimate:", error);

      setSaveMessage(
        "Estimate calculated, but could not be saved."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // AI ADVISOR
  // =====================================================

  const askWexaAI = async (question = aiQuestion) => {
    const finalQuestion = question.trim();

    if (!finalQuestion) {
      alert("Please enter a question for WEXA AI.");
      return;
    }

    try {
      setAiLoading(true);
      setAiAnswer("");
      setAiRecommendations([]);

      const response = await fetch(
        `${API}/api/ai/advice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: finalQuestion,
            projectName: selectedProject || null,
            area: area || null,
            budget: budget || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "AI request failed"
        );
      }

      setAiAnswer(data.answer || "");
      setAiRecommendations(
        data.recommendations || []
      );
    } catch (error) {
      console.error("AI error:", error);

      setAiAnswer(
        "WEXA AI could not process your request. Please make sure the backend is running on port 5000."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const quickAsk = (question) => {
    setAiQuestion(question);
    askWexaAI(question);
  };

  // =====================================================
  // FLOOR PLAN
  // =====================================================

  const generateFloorPlan = () => {
    if (!area || Number(area) <= 0) {
      setFloorPlanMessage(
        "Please enter the built-up area first."
      );
      return;
    }

    const sqft = Number(area);

    let plan;

    if (sqft < 1000) {
      plan =
        "Suggested concept: 1–2 bedrooms, living room, kitchen, 1–2 bathrooms and compact parking.";
    } else if (sqft < 1800) {
      plan =
        "Suggested concept: 2–3 bedrooms, living room, kitchen, 2–3 bathrooms, dining area and parking.";
    } else if (sqft < 3000) {
      plan =
        "Suggested concept: 3–4 bedrooms, spacious living room, kitchen, dining area, 3 bathrooms and parking.";
    } else {
      plan =
        "Suggested concept: 4+ bedrooms, large living and dining areas, multiple bathrooms, utility space and parking.";
    }

    setFloorPlanMessage(
      `For approximately ${sqft.toLocaleString(
        "en-IN"
      )} sq.ft: ${plan}`
    );
  };

  // =====================================================
  // MONEY FORMAT
  // =====================================================

  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  // =====================================================
  // NAVIGATION ITEMS
  // =====================================================

  const navItems = [
    ["Dashboard", "⌂"],
    ["Projects", "▣"],
    ["Cost Estimator", "◫"],
    ["Floor Plans", "⌗"],
    ["Materials", "◆"],
    ["AI Advisor", "◉"],
  ];

  return (
    <div style={styles.app}>

      {/* SIDEBAR */}

      <aside style={styles.sidebar}>

        <div style={styles.logo}>
          <div style={styles.logoIcon}>W</div>

          <div>
            <div style={styles.logoText}>
              WEXA
            </div>

            <div style={styles.logoSub}>
              Build Smarter
            </div>
          </div>
        </div>

        <nav style={styles.nav}>
          {navItems.map(([name, icon]) => (
            <div
              key={name}
              onClick={() =>
                handleNavigation(name)
              }
              style={{
                ...styles.navItem,
                ...(activePage === name
                  ? styles.activeNav
                  : {}),
              }}
            >
              <span>{icon}</span>
              {name}
            </div>
          ))}
        </nav>

        <div style={styles.sidebarBottom}>

          <div
            onClick={() =>
              handleNavigation("Settings")
            }
            style={{
              ...styles.navItem,
              ...(activePage === "Settings"
                ? styles.activeNav
                : {}),
            }}
          >
            <span>⚙</span>
            Settings
          </div>

          <div style={styles.userBox}>
            <div style={styles.avatar}>S</div>

            <div>
              <b>Welcome</b>
              <small>WEXA User</small>
            </div>
          </div>

        </div>
      </aside>

      {/* MAIN */}

      <main style={styles.main}>

        {/* =================================================
            DASHBOARD
        ================================================= */}

        {activePage === "Dashboard" && (
          <>
            <header style={styles.header}>

              <div>
                <p style={styles.hello}>
                  Good afternoon 👋
                </p>

                <h1 style={styles.heading}>
                  Construction Dashboard
                </h1>
              </div>

              <button
                style={styles.aiButton}
                onClick={() =>
                  handleNavigation("AI Advisor")
                }
              >
                ✨ Ask WEXA AI
              </button>

            </header>

            <section style={styles.statsGrid}>

              <div style={styles.statCard}>
                <span style={styles.statIcon}>
                  🏗️
                </span>

                <div>
                  <p style={styles.statLabel}>
                    Active Projects
                  </p>

                  <h2 style={styles.statValue}>
                    {projects.length || 3}
                  </h2>
                </div>
              </div>

              <div style={styles.statCard}>
                <span style={styles.statIcon}>
                  ₹
                </span>

                <div>
                  <p style={styles.statLabel}>
                    Estimated Budget
                  </p>

                  <h2 style={styles.statValue}>
                    ₹42.5L
                  </h2>
                </div>
              </div>

              <div style={styles.statCard}>
                <span style={styles.statIcon}>
                  📐
                </span>

                <div>
                  <p style={styles.statLabel}>
                    Total Built-up Area
                  </p>

                  <h2 style={styles.statValue}>
                    4,850 ft²
                  </h2>
                </div>
              </div>

              <div style={styles.statCard}>
                <span style={styles.statIcon}>
                  📅
                </span>

                <div>
                  <p style={styles.statLabel}>
                    Expected Completion
                  </p>

                  <h2 style={styles.statValue}>
                    Dec 2026
                  </h2>
                </div>
              </div>

            </section>

            <section style={styles.contentGrid}>

              {/* COST */}

              <div style={styles.card}>

                <div style={styles.cardHeader}>

                  <div>
                    <p style={styles.cardEyebrow}>
                      AI POWERED
                    </p>

                    <h2 style={styles.cardTitle}>
                      Quick Cost Estimator
                    </h2>
                  </div>

                  <span style={styles.cardEmoji}>
                    💰
                  </span>

                </div>

                <p style={styles.description}>
                  Get an approximate construction
                  cost based on your built-up area.
                </p>

                <label style={styles.label}>
                  Built-up Area (sq.ft)
                </label>

                <input
                  type="number"
                  placeholder="Example: 2000"
                  value={area}
                  onChange={(e) =>
                    setArea(e.target.value)
                  }
                  style={styles.input}
                />

                <label style={styles.label}>
                  Your Budget (optional)
                </label>

                <input
                  type="number"
                  placeholder="Example: 5000000"
                  value={budget}
                  onChange={(e) =>
                    setBudget(e.target.value)
                  }
                  style={styles.input}
                />

                <button
                  onClick={calculateEstimate}
                  style={styles.primaryButton}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Calculate Estimate →"}
                </button>

                {estimate !== null && (
                  <div style={styles.resultBox}>
                    <span>
                      Estimated Construction Cost
                    </span>

                    <strong>
                      {formatMoney(estimate)}
                    </strong>

                    <small>
                      Approx. ₹2,200 per sq.ft
                    </small>

                    {saveMessage && (
                      <span
                        style={styles.saveMessage}
                      >
                        {saveMessage}
                      </span>
                    )}
                  </div>
                )}

              </div>

              {/* AI */}

              <div
                style={{
                  ...styles.card,
                  ...styles.aiCard,
                }}
              >

                <div style={styles.aiCircle}>
                  ✨
                </div>

                <p style={styles.cardEyebrow}>
                  WEXA AI
                </p>

                <h2 style={styles.cardTitle}>
                  Your AI Construction Advisor
                </h2>

                <p style={styles.description}>
                  Get construction planning,
                  material, cost and project
                  recommendations.
                </p>

                <div style={styles.aiSuggestions}>

                  <div
                    onClick={() =>
                      quickAsk(
                        "How can I reduce my construction cost?"
                      )
                    }
                    style={styles.suggestion}
                  >
                    💰 Reduce construction cost
                  </div>

                  <div
                    onClick={() =>
                      quickAsk(
                        "What materials should I consider?"
                      )
                    }
                    style={styles.suggestion}
                  >
                    🧱 Select materials
                  </div>

                  <div
                    onClick={() =>
                      quickAsk(
                        "Give me house planning recommendations."
                      )
                    }
                    style={styles.suggestion}
                  >
                    🏠 House planning
                  </div>

                  <div
                    onClick={() =>
                      quickAsk(
                        "Analyze my construction project."
                      )
                    }
                    style={styles.suggestion}
                  >
                    📊 Analyze project
                  </div>

                </div>

                <button
                  style={styles.secondaryButton}
                  onClick={() =>
                    handleNavigation("AI Advisor")
                  }
                >
                  Start AI Planning →
                </button>

              </div>

            </section>

            <section style={styles.projectsCard}>

              <div style={styles.projectsHeader}>

                <div>
                  <p style={styles.cardEyebrow}>
                    YOUR WORK
                  </p>

                  <h2 style={styles.cardTitle}>
                    Recent Projects
                  </h2>
                </div>

                <button
                  style={styles.outlineButton}
                  onClick={() =>
                    handleNavigation("Projects")
                  }
                >
                  View Projects →
                </button>

              </div>

              <div style={styles.projectGrid}>

                <Project
                  name="Modern Family Home"
                  location="Karimnagar, Telangana"
                  area="2,400 sq.ft"
                  progress="68%"
                />

                <Project
                  name="Luxury Villa"
                  location="Hyderabad, Telangana"
                  area="3,200 sq.ft"
                  progress="42%"
                />

                <Project
                  name="Rental Apartments"
                  location="Warangal, Telangana"
                  area="5,800 sq.ft"
                  progress="25%"
                />

              </div>

            </section>
          </>
        )}

        {/* =================================================
            PROJECTS
        ================================================= */}

        {activePage === "Projects" && (
          <PageCard
            eyebrow="WEXA PROJECTS"
            title="Projects"
            description="View and manage your construction projects."
          >

            {loadingProjects ? (
              <p>Loading projects...</p>
            ) : projects.length > 0 ? (

              <div style={styles.fullProjectGrid}>

                {projects.map((project, index) => (
                  <div
                    key={index}
                    style={styles.databaseProject}
                  >

                    <div style={styles.projectImage}>
                      🏠
                    </div>

                    <div>
                      <h3 style={styles.projectName}>
                        {project.name}
                      </h3>

                      <p style={styles.projectLocation}>
                        📍{" "}
                        {project.location ||
                          "Location not available"}
                      </p>

                      <p style={styles.projectArea}>
                        📐 {project.area} sq.ft
                      </p>

                      <p style={styles.projectArea}>
                        📊 Progress:{" "}
                        {project.progress}%
                      </p>

                      {project.estimate && (
                        <p style={styles.projectArea}>
                          💰 Estimate:{" "}
                          {formatMoney(
                            project.estimate
                          )}
                        </p>
                      )}

                      <button
                        style={styles.smallBlueButton}
                        onClick={() => {
                          setSelectedProject(
                            project.name
                          );
                          handleNavigation(
                            "AI Advisor"
                          );
                        }}
                      >
                        Analyze with AI
                      </button>
                    </div>

                  </div>
                ))}

              </div>

            ) : (
              <p>No projects found in CognitoDB.</p>
            )}

            <button
              style={styles.primaryButtonSmall}
              onClick={loadProjects}
            >
              Refresh Projects ↻
            </button>

          </PageCard>
        )}

        {/* =================================================
            COST ESTIMATOR
        ================================================= */}

        {activePage === "Cost Estimator" && (
          <PageCard
            eyebrow="AI POWERED"
            title="Cost Estimator"
            description="Calculate your approximate construction cost."
          >

            <label style={styles.label}>
              Built-up Area (sq.ft)
            </label>

            <input
              type="number"
              placeholder="Example: 2000"
              value={area}
              onChange={(e) =>
                setArea(e.target.value)
              }
              style={styles.input}
            />

            <label style={styles.label}>
              Your Budget (optional)
            </label>

            <input
              type="number"
              placeholder="Example: 5000000"
              value={budget}
              onChange={(e) =>
                setBudget(e.target.value)
              }
              style={styles.input}
            />

            <button
              style={styles.primaryButtonSmall}
              onClick={calculateEstimate}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Calculate & Save Estimate →"}
            </button>

            {estimate !== null && (
              <div style={styles.resultBox}>

                <span>
                  Estimated Construction Cost
                </span>

                <strong>
                  {formatMoney(estimate)}
                </strong>

                <small>
                  Approx. ₹2,200 per sq.ft
                </small>

                <span style={styles.saveMessage}>
                  {saveMessage}
                </span>

              </div>
            )}

          </PageCard>
        )}

        {/* =================================================
            FLOOR PLANS
        ================================================= */}

        {activePage === "Floor Plans" && (
          <PageCard
            eyebrow="WEXA PLANNING"
            title="Floor Plans"
            description="Create and manage residential floor plans."
          >

            <div style={styles.featureGrid}>

              <Feature
                icon="🏠"
                title="House Plan"
                text="Generate a suitable house planning concept."
              />

              <Feature
                icon="📐"
                title="Area Planning"
                text="Plan rooms according to available built-up area."
              />

              <Feature
                icon="🛏️"
                title="Room Layout"
                text="Organize bedrooms, kitchen, living and other spaces."
              />

              <Feature
                icon="🚗"
                title="Parking"
                text="Consider parking and circulation requirements."
              />

            </div>

            <label style={styles.label}>
              Built-up Area (sq.ft)
            </label>

            <input
              type="number"
              placeholder="Example: 2000"
              value={area}
              onChange={(e) =>
                setArea(e.target.value)
              }
              style={styles.input}
            />

            <button
              style={styles.primaryButtonSmall}
              onClick={generateFloorPlan}
            >
              Generate Floor Plan →
            </button>

            {floorPlanMessage && (
              <div style={styles.resultBox}>
                <strong>WEXA Planning Suggestion</strong>
                <span>{floorPlanMessage}</span>
              </div>
            )}

          </PageCard>
        )}

        {/* =================================================
            MATERIALS
        ================================================= */}

        {activePage === "Materials" && (
          <PageCard
            eyebrow="CONSTRUCTION MATERIALS"
            title="Materials"
            description="Explore construction materials and supplier information from CognitoDB."
          >

            {loadingMaterials ? (
              <p>Loading materials...</p>
            ) : materials.length > 0 ? (

              <div style={styles.materialGrid}>

                {materials.map((material, index) => (
                  <div
                    key={index}
                    style={styles.materialCard}
                  >

                    <div style={styles.featureIcon}>
                      {material.name ===
                      "Cement"
                        ? "🏗️"
                        : material.name ===
                          "Steel"
                        ? "🔩"
                        : material.name ===
                          "Red Bricks"
                        ? "🧱"
                        : "◼️"}
                    </div>

                    <h3>
                      {material.name}
                    </h3>

                    <p>
                      Category:{" "}
                      {material.category}
                    </p>

                    <p>
                      Unit: {material.unit}
                    </p>

                    <strong>
                      ₹{material.price}
                    </strong>

                    {material.suppliers?.length >
                      0 && (
                      <p style={styles.supplierText}>
                        Supplier:{" "}
                        {
                          material.suppliers[0]
                            .name
                        }
                      </p>
                    )}

                  </div>
                ))}

              </div>

            ) : (
              <p>
                No construction materials found.
              </p>
            )}

            <button
              style={styles.primaryButtonSmall}
              onClick={loadMaterials}
            >
              Refresh Materials ↻
            </button>

            <button
              style={{
                ...styles.secondaryButton,
                marginLeft: "10px",
              }}
              onClick={() =>
                quickAsk(
                  "What materials should I use for construction?"
                )
              }
            >
              Ask WEXA AI ✨
            </button>

          </PageCard>
        )}

        {/* =================================================
            AI ADVISOR
        ================================================= */}

        {activePage === "AI Advisor" && (
          <PageCard
            eyebrow="WEXA AI"
            title="AI Construction Advisor"
            description="Ask WEXA about construction planning, costs, materials and project analysis."
          >

            <div style={styles.aiLargeIcon}>
              ✨
            </div>

            <div style={styles.aiPanel}>

              <div style={styles.aiPanelHeader}>
                <strong>
                  WEXA AI Assistant
                </strong>

                <span style={styles.aiStatus}>
                  ● Online
                </span>
              </div>

              <label style={styles.label}>
                Project context (optional)
              </label>

              <select
                value={selectedProject}
                onChange={(e) =>
                  setSelectedProject(
                    e.target.value
                  )
                }
                style={styles.input}
              >
                <option value="">
                  General construction advice
                </option>

                {projects.map((project) => (
                  <option
                    key={project.name}
                    value={project.name}
                  >
                    {project.name}
                  </option>
                ))}
              </select>

              <label style={styles.label}>
                Ask WEXA AI
              </label>

              <textarea
                value={aiQuestion}
                onChange={(e) =>
                  setAiQuestion(e.target.value)
                }
                placeholder="Example: How can I reduce the construction cost for my project?"
                style={styles.textarea}
              />

              <button
                style={styles.primaryButton}
                onClick={() => askWexaAI()}
                disabled={aiLoading}
              >
                {aiLoading
                  ? "WEXA AI is thinking..."
                  : "Ask WEXA AI ✨"}
              </button>

              <div style={styles.quickQuestions}>

                <button
                  onClick={() =>
                    quickAsk(
                      "How can I reduce construction cost?"
                    )
                  }
                >
                  Reduce cost
                </button>

                <button
                  onClick={() =>
                    quickAsk(
                      "What construction materials should I consider?"
                    )
                  }
                >
                  Materials
                </button>

                <button
                  onClick={() =>
                    quickAsk(
                      "Give me house planning recommendations."
                    )
                  }
                >
                  House planning
                </button>

                <button
                  onClick={() =>
                    quickAsk(
                      "Analyze my construction project."
                    )
                  }
                >
                  Analyze project
                </button>

              </div>

              {aiAnswer && (
                <div style={styles.aiResponse}>

                  <div style={styles.responseTitle}>
                    ✨ WEXA AI
                  </div>

                  <p style={styles.aiAnswer}>
                    {aiAnswer}
                  </p>

                  {aiRecommendations.length >
                    0 && (
                    <>
                      <h4>
                        Recommendations
                      </h4>

                      <ul>
                        {aiRecommendations.map(
                          (item, index) => (
                            <li key={index}>
                              {item}
                            </li>
                          )
                        )}
                      </ul>
                    </>
                  )}

                </div>
              )}

            </div>

          </PageCard>
        )}

        {/* =================================================
            SETTINGS
        ================================================= */}

        {activePage === "Settings" && (
          <PageCard
            eyebrow="WEXA SETTINGS"
            title="Settings"
            description="Manage your WEXA application settings."
          >

            <div style={styles.settingRow}>
              <div>
                <strong>
                  Application
                </strong>
                <p>
                  WEXA Construction Planning
                </p>
              </div>

              <span style={styles.statusBadge}>
                Active
              </span>
            </div>

            <div style={styles.settingRow}>
              <div>
                <strong>
                  Backend
                </strong>
                <p>
                  Express + Node.js
                </p>
              </div>

              <span style={styles.statusBadge}>
                Connected
              </span>
            </div>

            <div style={styles.settingRow}>
              <div>
                <strong>
                  Database
                </strong>
                <p>
                  CognitoDB / Neo4j Graph Database
                </p>
              </div>

              <span style={styles.statusBadge}>
                Connected
              </span>
            </div>

            <div style={styles.settingRow}>
              <div>
                <strong>
                  WEXA AI
                </strong>
                <p>
                  Construction advisory engine
                </p>
              </div>

              <span style={styles.statusBadge}>
                Online
              </span>
            </div>

          </PageCard>
        )}

        <footer style={styles.footer}>
          ©️ 2026 WEXA • AI Powered Construction Planning
        </footer>

      </main>
    </div>
  );
}

// =========================================================
// PROJECT
// =========================================================

function Project({
  name,
  location,
  area,
  progress,
}) {
  return (
    <div style={styles.project}>

      <div style={styles.projectImage}>
        🏠
      </div>

      <div style={{ flex: 1 }}>

        <h3 style={styles.projectName}>
          {name}
        </h3>

        <p style={styles.projectLocation}>
          📍 {location}
        </p>

        <p style={styles.projectArea}>
          📐 {area}
        </p>

        <div style={styles.progressBackground}>
          <div
            style={{
              ...styles.progress,
              width: progress,
            }}
          />
        </div>

        <div style={styles.progressText}>
          <span>
            Project Progress
          </span>

          <b>{progress}</b>
        </div>

      </div>

    </div>
  );
}

// =========================================================
// PAGE CARD
// =========================================================

function PageCard({
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <div>

      <header style={styles.pageHeader}>
        <div>

          <p style={styles.hello}>
            WEXA CONSTRUCTION PLATFORM
          </p>

          <h1 style={styles.heading}>
            {title}
          </h1>

        </div>
      </header>

      <div style={styles.card}>

        <p style={styles.cardEyebrow}>
          {eyebrow}
        </p>

        <h2 style={styles.cardTitle}>
          {title}
        </h2>

        <p style={styles.description}>
          {description}
        </p>

        {children}

      </div>

    </div>
  );
}

// =========================================================
// FEATURE
// =========================================================

function Feature({
  icon,
  title,
  text,
}) {
  return (
    <div style={styles.feature}>

      <div style={styles.featureIcon}>
        {icon}
      </div>

      <div>

        <h3 style={styles.featureTitle}>
          {title}
        </h3>

        <p style={styles.featureText}>
          {text}
        </p>

      </div>

    </div>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = {
  app: {
    minHeight: "100vh",
    display: "flex",
    background: "#f5f7fb",
    color: "#172033",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },

  sidebar: {
    width: "240px",
    minHeight: "100vh",
    background: "#111827",
    color: "#fff",
    padding: "26px 18px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    position: "sticky",
    top: 0,
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "45px",
    paddingLeft: "8px",
  },

  logoIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "20px",
  },

  logoText: {
    fontSize: "21px",
    fontWeight: "800",
    letterSpacing: "1px",
  },

  logoSub: {
    color: "#94a3b8",
    fontSize: "11px",
    marginTop: "2px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "13px 14px",
    borderRadius: "10px",
    color: "#cbd5e1",
    fontSize: "14px",
    cursor: "pointer",
  },

  activeNav: {
    background: "#2563eb",
    color: "#fff",
  },

  sidebarBottom: {
    marginTop: "auto",
  },

  userBox: {
    marginTop: "20px",
    padding: "14px 10px",
    borderTop: "1px solid #293548",
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "#334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
  },

  main: {
    flex: 1,
    padding: "34px 42px",
    maxWidth: "1500px",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  hello: {
    margin: "0 0 5px",
    color: "#64748b",
    fontSize: "14px",
  },

  heading: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "800",
  },

  aiButton: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "13px 20px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "18px",
    marginBottom: "22px",
  },

  statCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow:
      "0 2px 10px rgba(15, 23, 42, 0.05)",
  },

  statIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "12px",
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },

  statLabel: {
    margin: 0,
    color: "#64748b",
    fontSize: "12px",
  },

  statValue: {
    margin: "5px 0 0",
    fontSize: "21px",
  },

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: "22px",
    marginBottom: "22px",
  },

  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "26px",
    boxShadow:
      "0 2px 10px rgba(15, 23, 42, 0.05)",
  },

  aiCard: {
    background:
      "linear-gradient(135deg, #eff6ff, #ffffff)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  cardEyebrow: {
    margin: 0,
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1px",
  },

  cardTitle: {
    margin: "5px 0 0",
    fontSize: "21px",
  },

  cardEmoji: {
    fontSize: "28px",
  },

  description: {
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.6,
    margin: "12px 0 20px",
  },

  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "7px",
    color: "#475569",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #dbe2ea",
    borderRadius: "9px",
    padding: "12px",
    marginBottom: "14px",
    outline: "none",
    fontSize: "14px",
    background: "#fff",
  },

  textarea: {
    width: "100%",
    minHeight: "120px",
    boxSizing: "border-box",
    border: "1px solid #dbe2ea",
    borderRadius: "10px",
    padding: "13px",
    marginBottom: "14px",
    resize: "vertical",
    fontFamily: "inherit",
    fontSize: "14px",
    outline: "none",
  },

  primaryButton: {
    width: "100%",
    border: "none",
    borderRadius: "9px",
    padding: "13px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },

  primaryButtonSmall: {
    border: "none",
    borderRadius: "9px",
    padding: "13px 20px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "20px",
  },

  resultBox: {
    marginTop: "18px",
    padding: "16px",
    borderRadius: "12px",
    background: "#ecfdf5",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  saveMessage: {
    color: "#059669",
    fontWeight: "600",
    marginTop: "8px",
  },

  aiCircle: {
    width: "50px",
    height: "50px",
    borderRadius: "14px",
    background: "#2563eb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    marginBottom: "20px",
  },

  aiSuggestions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "9px",
    margin: "20px 0",
  },

  suggestion: {
    padding: "12px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "13px",
  },

  secondaryButton: {
    border: "none",
    borderRadius: "9px",
    padding: "12px 18px",
    background: "#172033",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },

  projectsCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "26px",
    boxShadow:
      "0 2px 10px rgba(15, 23, 42, 0.05)",
  },

  projectsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  outlineButton: {
    border: "1px solid #dbe2ea",
    background: "#fff",
    padding: "10px 15px",
    borderRadius: "9px",
    fontWeight: "700",
    cursor: "pointer",
  },

  projectGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "15px",
  },

  fullProjectGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
    marginTop: "20px",
  },

  databaseProject: {
    border: "1px solid #e5e7eb",
    borderRadius: "13px",
    padding: "16px",
    display: "flex",
    gap: "13px",
  },

  project: {
    border: "1px solid #e5e7eb",
    borderRadius: "13px",
    padding: "14px",
    display: "flex",
    gap: "13px",
  },

  projectImage: {
    width: "55px",
    height: "55px",
    minWidth: "55px",
    borderRadius: "10px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
  },

  projectName: {
    margin: 0,
    fontSize: "14px",
  },

  projectLocation: {
    margin: "5px 0",
    color: "#64748b",
    fontSize: "11px",
  },

  projectArea: {
    margin: "0 0 10px",
    color: "#475569",
    fontSize: "11px",
  },

  progressBackground: {
    height: "5px",
    background: "#e5e7eb",
    borderRadius: "10px",
    overflow: "hidden",
  },

  progress: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "10px",
  },

  progressText: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "10px",
    color: "#64748b",
    marginTop: "5px",
  },

  featureGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "15px",
    marginTop: "20px",
  },

  feature: {
    border: "1px solid #e5e7eb",
    borderRadius: "13px",
    padding: "18px",
    display: "flex",
    gap: "13px",
    alignItems: "flex-start",
  },

  featureIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "10px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
    flexShrink: 0,
  },

  featureTitle: {
    margin: 0,
    fontSize: "14px",
  },

  featureText: {
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.5,
    margin: "5px 0 0",
  },

  aiLargeIcon: {
    width: "65px",
    height: "65px",
    borderRadius: "17px",
    background: "#2563eb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    marginBottom: "20px",
  },

  aiPanel: {
    maxWidth: "850px",
    border: "1px solid #e2e8f0",
    borderRadius: "15px",
    padding: "20px",
    background: "#f8fafc",
  },

  aiPanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    fontSize: "17px",
  },

  aiStatus: {
    color: "#059669",
    fontSize: "12px",
    fontWeight: "700",
  },

  quickQuestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "12px",
  },

  quickQuestionsButton: {
    border: "1px solid #dbe2ea",
    background: "#fff",
    borderRadius: "20px",
    padding: "8px 12px",
    cursor: "pointer",
  },

  aiResponse: {
    marginTop: "20px",
    padding: "20px",
    background: "#fff",
    borderRadius: "13px",
    border: "1px solid #dbe2ea",
  },

  responseTitle: {
    color: "#2563eb",
    fontWeight: "800",
    marginBottom: "10px",
  },

  aiAnswer: {
    lineHeight: 1.7,
    color: "#334155",
  },

  materialGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "15px",
    marginTop: "20px",
  },

  materialCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "13px",
    padding: "18px",
    background: "#fff",
  },

  supplierText: {
    color: "#2563eb",
    fontSize: "12px",
  },

  smallBlueButton: {
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    padding: "8px 11px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  },

  settingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0",
    borderBottom: "1px solid #e5e7eb",
  },

  statusBadge: {
    background: "#ecfdf5",
    color: "#059669",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
  },

  footer: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "11px",
    padding: "25px",
  },
};

export default App;