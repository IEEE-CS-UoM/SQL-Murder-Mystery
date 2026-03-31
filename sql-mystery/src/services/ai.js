import { GoogleGenAI } from "@google/genai";
import { parseSchema, buildSystemPrompt } from "../utils/schemaParser";
import { isSafeQuery } from "../utils/security";
import { SEED_SQL } from "../data/seed";

// 11. Parse schema once contextually, not every function call
const SCHEMA_STRING = parseSchema(SEED_SQL);

// 6. Strict SQL extraction
export function extractSQL(text) {
  if (!text) return "";
  const match = text.match(/```(?:sql)?\s*([\s\S]*?)```/i);
  if (match) {
    return match[1].trim();
  }
  return text.trim();
}

let aiClient = null;
function getAiClient() {
  if (!aiClient) {
    // 1. & 15. Real API keys should be moved to a backend proxy.
    // For this static site context, we strictly require the environment variable 
    // to fail predictably rather than using a confusing mock fallback in production.
    const apiKey = import.meta.env?.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Missing VITE_GEMINI_API_KEY environment variable. AI features are disabled."
      );
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function generateSQL(naturalLanguageQuery, runQuery) {
  // 14. Strong instructions to prevent prose
  const systemInstruction =
    buildSystemPrompt(SCHEMA_STRING) +
    `\nYou have access to a tool 'test_query'. Use it to run your generated SQL to verify if it returns the expected results or causes an error. Make sure to fix any errors before providing the final answer.
    
    CRITICAL RULES:
    - Return ONLY raw SQL.
    - No markdown formatting.
    - No explanations.
    - No prose.
    - Do not answer in natural language.`;

  let chat;
  try {
    const ai = getAiClient();
    chat = ai.chats.create({
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
  } catch (err) {
    console.error("AI Initialization Error:", err);
    throw err;
  }

  try {
    let currentResponse = await chat.sendMessage({
      message: naturalLanguageQuery,
    });

    let toolCallsCount = 0;
    
    // 8. Safely loop and handle all function calls returned
    while (
      currentResponse.functionCalls &&
      currentResponse.functionCalls.length > 0 &&
      toolCallsCount < 3
    ) {
      toolCallsCount++;
      const functionResponses = [];

      for (const call of currentResponse.functionCalls) {
        if (call.name === "test_query") {
          const sql = call.args.sql;
          let resultStr;

          // 2. & 3. Ensure tool checks same strict constraints
          if (!isSafeQuery(sql)) {
            resultStr = JSON.stringify({
              error: "Unsafe query. Only single SELECT statements are allowed.",
            });
          } else {
            // 4. & 5. Protect runQuery failure limits and treat as async just in case
            try {
              const result = await runQuery(sql);
              if (result && result.error) {
                resultStr = JSON.stringify({ error: result.error });
              } else if (result) {
                resultStr = JSON.stringify({
                  columns: result.columns,
                  rowCount: result.rows?.length || 0,
                  firstRow: result.rows?.[0] || [],
                });
              } else {
                resultStr = JSON.stringify({ error: "Unknown execution error." });
              }
            } catch (err) {
              resultStr = JSON.stringify({ error: err.message || "Execution exception." });
            }
          }

          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { result: resultStr },
            },
          });
        }
      }

      if (functionResponses.length > 0) {
        // 9. Send back the exact shape required to satisfy the tool responses
        currentResponse = await chat.sendMessage(functionResponses);
      } else {
        break;
      }
    }

    // 12. Fallback when text is empty
    let finalOutput = currentResponse.text || "";
    if (!finalOutput.trim()) {
      throw new Error("Model did not return SQL.");
    }

    let generatedSql = extractSQL(finalOutput);

    // 7. Final rigorous safety validation checking
    if (!isSafeQuery(generatedSql)) {
      throw new Error(
        "Generated query contained forbidden commands or invalid structure."
      );
    }

    return generatedSql;
  } catch (error) {
    // 16. Log exact issue without alerting user, wrap in safe message UI side
    console.error("AI Generation Internal Error:", error);
    throw new Error(error.message || "Failed to generate SQL");
  }
}
