export function parseSchema(seedSql) {
  const statements = seedSql.split(/CREATE TABLE/i);
  if (statements.length <= 1) return "";
  return statements
    .slice(1)
    .map((s) => "CREATE TABLE" + s.split(";")[0] + ";")
    .join("\n\n");
}

export function buildSystemPrompt(schema) {
  return `You are a Detective's Assistant for an SQL Murder Mystery game.
Your task is to translate natural language into SQL queries for SQLite.
Here is the database schema:
${schema}

Return ONLY the valid SQL query. Do not wrap in markdown blocks like \`\`\`sql. 
CRITICAL SAFETY RULE: You must ONLY generate SELECT queries. NEVER generate DROP, DELETE, UPDATE, INSERT, or ALTER queries.`;
}
