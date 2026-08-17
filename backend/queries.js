// WEXA Graph Database Queries

// 1. Get all projects with their locations and estimates
const getProjectsQuery = `
  MATCH (p:Project)
  OPTIONAL MATCH (p)-[:LOCATED_IN]->(l:Location)
  OPTIONAL MATCH (p)-[:HAS_ESTIMATE]->(e:Estimate)

  RETURN
    p.name AS project,
    p.area AS area,
    p.progress AS progress,
    l.name AS location,
    e.estimate AS estimate,
    e.budget AS budget
  ORDER BY p.name
`;

// 2. Get all materials used by a project
const getProjectMaterialsQuery = `
  MATCH (p:Project {name: $projectName})
      -[:USES_MATERIAL]->(m:Material)

  RETURN
    m.name AS material,
    m.category AS category,
    m.unit AS unit,
    m.price AS price
  ORDER BY m.name
`;

// 3. REQUIRED 2-HOP QUERY
// Project → Material → Supplier
const getProjectSuppliersQuery = `
  MATCH (p:Project {name: $projectName})
      -[:USES_MATERIAL]->(m:Material)
      -[:SUPPLIED_BY]->(s:Supplier)

  RETURN
    p.name AS project,
    m.name AS material,
    s.name AS supplier,
    s.phone AS phone
  ORDER BY m.name
`;

// 4. Graph-specific query:
// Find other projects connected through shared suppliers
const getRelatedProjectsQuery = `
  MATCH
    (p1:Project {name: $projectName})
      -[:USES_MATERIAL]->(:Material)
      -[:SUPPLIED_BY]->(s:Supplier)
      <-[:SUPPLIED_BY]-(:Material)
      <-[:USES_MATERIAL]-(p2:Project)

  WHERE p1 <> p2

  RETURN DISTINCT
    p2.name AS relatedProject,
    s.name AS sharedSupplier
  ORDER BY p2.name
`;

// 5. Get all materials and their suppliers
const getMaterialsWithSuppliersQuery = `
  MATCH (m:Material)
      -[:SUPPLIED_BY]->(s:Supplier)

  RETURN
    m.name AS material,
    m.category AS category,
    m.price AS price,
    s.name AS supplier,
    s.phone AS phone
  ORDER BY m.name
`;

module.exports = {
  getProjectsQuery,
  getProjectMaterialsQuery,
  getProjectSuppliersQuery,
  getRelatedProjectsQuery,
  getMaterialsWithSuppliersQuery
};