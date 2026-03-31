import { describe, it, expect } from "vitest";
import { isSafeQuery } from "./security";

describe("isSafeQuery", () => {
  it("allows simple SELECT queries", () => {
    expect(isSafeQuery("SELECT * FROM users;")).toBe(true);
    expect(isSafeQuery("   SELECT name FROM users  ")).toBe(true);
  });

  it("allows WITH clauses", () => {
    expect(isSafeQuery("WITH t AS (SELECT 1) SELECT * FROM t;")).toBe(true);
  });

  it("rejects destructive commands", () => {
    expect(isSafeQuery("DROP TABLE users;")).toBe(false);
    expect(isSafeQuery("DELETE FROM users;")).toBe(false);
    expect(isSafeQuery('UPDATE users SET name = "Test";')).toBe(false);
    expect(isSafeQuery("INSERT INTO users VALUES (1);")).toBe(false);
  });

  it("rejects PRAGMA and ATTACH", () => {
    expect(isSafeQuery("PRAGMA table_info(users);")).toBe(false);
    expect(isSafeQuery('ATTACH DATABASE "foo.db" AS foo;')).toBe(false);
  });

  it("rejects commands that do not start with SELECT or WITH", () => {
    expect(isSafeQuery("EXPLAIN QUERY PLAN SELECT * FROM users;")).toBe(false);
    expect(isSafeQuery("CREATE TABLE foo (id int);")).toBe(false);
  });

  it("rejects multiple statements", () => {
    expect(isSafeQuery("SELECT * FROM users; DROP TABLE cars;")).toBe(false);
    expect(isSafeQuery("SELECT * FROM users; SELECT * FROM users;")).toBe(
      false,
    );
    // Trailing semicolon with spaces should be allowed though
    expect(isSafeQuery("SELECT * FROM users;   ")).toBe(true);
  });

  it("handles comments properly", () => {
    expect(isSafeQuery("-- nice query\nSELECT * FROM users;")).toBe(true);
    expect(isSafeQuery("/* block */ SELECT * FROM users;")).toBe(true);
    expect(isSafeQuery("SELECT * FROM users; -- trailing")).toBe(true);

    // Malicious comments hiding a bad start
    expect(isSafeQuery("-- hidden\nDROP TABLE users;")).toBe(false);
  });
});
