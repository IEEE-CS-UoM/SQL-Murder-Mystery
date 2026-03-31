export function isSafeQuery(sql) {
  if (!sql || typeof sql !== "string") return false;

  // Strip comments to analyze structure
  const cleanSql = sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();

  // Must start with SELECT or WITH
  if (!/^(?:SELECT|WITH)\b/i.test(cleanSql)) {
    return false;
  }

  // Reject multiple statements (semicolon followed by anything other than whitespace)
  if (/;[\s]*\S/.test(cleanSql)) {
    return false;
  }

  // Reject forbidden administrative and destructive keywords
  const dangerousKeywords = [
    "DROP",
    "DELETE",
    "UPDATE",
    "INSERT",
    "ALTER",
    "CREATE",
    "REPLACE",
    "TRUNCATE",
    "PRAGMA",
    "ATTACH",
    "DETACH",
  ];

  if (
    dangerousKeywords.some((keyword) =>
      new RegExp("\\b" + keyword + "\\b", "i").test(cleanSql),
    )
  ) {
    return false;
  }

  return true;
}
