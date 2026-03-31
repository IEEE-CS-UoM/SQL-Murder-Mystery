import { GoogleGenAI } from "@google/genai";
import { parseSchema, buildSystemPrompt } from "../utils/schemaParser";
import { SEED_SQL } from "../data/seed";

export function isSafeQuery(sql) {
  const dangerousKeywords = [
    "DROP",
    "DELETE",
    "UPDATE",
    "INSERT",
    "ALTER",
    "CREATE",
    "REPLACE",
    "TRUNCATE",
  ];
  return !dangerousKeywords.some((keyword) =>
    new RegExp("\\b" + keyword + "\\b", "i").test(sql),
  );
}

// In real app, this should be set in .env as VITE_GEMINI_API_KEY
const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || "MOCK_KEY";
const ai = new GoogleGenAI({ apiKey });

export async function generateSQL(naturalLanguageQuery, runQuery) {
  const schema = parseSchema(SEED_SQL);
  const systemInstruction =
    buildSystemPrompt(schema) +
    `\nYou have access to a tool 'test_query'. Use it to run your generated SQL to verify if it returns the expected results or causes an error. Make sure to fix any errors before providing the final answer.`;

  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction,
        temperature: 0.1,
        tools: [
          {
            functionDeclarations: [
              {
                name: "test_query",
                description:
                  "Executes a SQL query against the SQLite database to check if it works.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    sql: {
                      type: "STRING",
                      description: "The SQL query to test",
                    },
                  },
                  required: ["sql"],
                },
              },
            ],
          },
        ],
      },
    });

    let currentResponse = await chat.sendMessage({
      message: naturalLanguageQuery,
    });

    // Simple loop for function calls (max 3 iterations)
    for (let i = 0; i < 3; i++) {
      const functionCalls = currentResponse.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        if (call.name === "test_query") {
          const sql = call.args.sql;
          let resultStr;

          if (!isSafeQuery(sql)) {
            resultStr = JSON.stringify({
              error: "Unsafe query. Do not use destructive commands.",
            });
          } else {
            const result = runQuery(sql);
            if (result.error) {
              resultStr = JSON.stringify({ error: result.error });
            } else {
              // Summarize result to prevent huge payload
              resultStr = JSON.stringify({
                columns: result.columns,
                rowCount: result.rows?.length || 0,
                firstRow: result.rows?.[0] || [],
              });
            }
          }

          currentResponse = await chat.sendMessage({
            message: [
              {
                functionResponse: {
                  name: "test_query",
                  response: { result: resultStr },
                },
              },
            ],
          });
          continue;
        }
      }
      break; // No more function calls
    }

    let generatedSql = currentResponse.text || "";
    generatedSql = generatedSql
      .replace(/^```sql/im, "")
      .replace(/```$/, "")
      .trim();

    if (!isSafeQuery(generatedSql)) {
      throw new Error(
        "Generated query contained forbidden destructive commands.",
      );
    }

    return generatedSql;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error(error.message || "Failed to generate SQL");
  }
}
