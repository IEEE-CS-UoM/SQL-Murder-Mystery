import { describe, it, expect } from "vitest";
import { parseSchema, buildSystemPrompt } from "./schemaParser";

describe("schemaParser", () => {
  it("should extract CREATE TABLE statements from seed SQL", () => {
    const seed = `
      CREATE TABLE users (id INT, name TEXT);
      INSERT INTO users VALUES (1, 'Alice');
      CREATE TABLE posts (id INT, user_id INT, title TEXT);
    `;
    const result = parseSchema(seed);
    expect(result).toContain("CREATE TABLE users (id INT, name TEXT);");
    expect(result).toContain(
      "CREATE TABLE posts (id INT, user_id INT, title TEXT);",
    );
    expect(result).not.toContain("INSERT");
  });

  it("should build a system prompt including the schema", () => {
    const schema = "CREATE TABLE test (id INT);";
    const prompt = buildSystemPrompt(schema);
    expect(prompt).toContain(schema);
    expect(prompt).toContain("Return ONLY the valid SQL query");
  });
});
