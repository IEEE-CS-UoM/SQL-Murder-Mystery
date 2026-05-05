import Groq from "groq-sdk";
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
    const apiKey =
      import.meta.env?.VITE_GROQ_API_KEY ||
      import.meta.env?.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Missing VITE_GROQ_API_KEY environment variable. AI features are disabled.",
      );
    }
    aiClient = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  }
  return aiClient;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(ai, params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await ai.chat.completions.create(params);
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 1500; // 1.5s, 3s, 6s...
        console.warn(`Rate limit hit (429). Retrying in ${waitTime}ms...`);
        await delay(waitTime);
      } else {
        throw error;
      }
    }
  }
}

export async function generateSQL(naturalLanguageQuery, runQuery) {
  const systemInstruction =
    buildSystemPrompt(SCHEMA_STRING) +
    `\nYou have access to a tool 'test_query'. Use it to run your generated SQL to verify if it returns the expected results or causes an error. Make sure to fix any errors before providing the final answer.
    
    CRITICAL RULES:
    - Return ONLY raw SQL.
    - No markdown formatting.
    - No explanations.
    - No prose.
    - Do not answer in natural language.`;

  const messages = [
    { role: "system", content: systemInstruction },
    { role: "user", content: naturalLanguageQuery },
  ];

  const tools = [
    {
      type: "function",
      function: {
        name: "test_query",
        description:
          "Executes a SQL query against the SQLite database to check if it works.",
        parameters: {
          type: "object",
          properties: {
            sql: {
              type: "string",
              description: "The SQL query to test",
            },
          },
          required: ["sql"],
        },
      },
    },
  ];

  try {
    const ai = getAiClient();
    let currentResponse = await fetchWithRetry(ai, {
      model: "llama-3.3-70b-versatile",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
      temperature: 0.1,
    });

    let toolCallsCount = 0;

    while (
      currentResponse.choices[0].message.tool_calls &&
      currentResponse.choices[0].message.tool_calls.length > 0 &&
      toolCallsCount < 3
    ) {
      toolCallsCount++;
      const responseMessage = currentResponse.choices[0].message;
      messages.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === "test_query") {
          const args = JSON.parse(toolCall.function.arguments);
          const sql = args.sql;
          let resultStr;

          if (!isSafeQuery(sql)) {
            resultStr = JSON.stringify({
              error: "Unsafe query. Only single SELECT statements are allowed.",
            });
          } else {
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
                resultStr = JSON.stringify({
                  error: "Unknown execution error.",
                });
              }
            } catch (err) {
              resultStr = JSON.stringify({
                error: err.message || "Execution exception.",
              });
            }
          }

          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: toolCall.function.name,
            content: resultStr,
          });
        }
      }

      currentResponse = await fetchWithRetry(ai, {
        model: "llama-3.3-70b-versatile",
        messages: messages,
        tools: tools,
        tool_choice: "auto",
        temperature: 0.1,
      });
    }

    let finalOutput = currentResponse.choices[0].message.content || "";
    if (!finalOutput.trim()) {
      throw new Error("Model did not return SQL.");
    }

    let generatedSql = extractSQL(finalOutput);

    if (!isSafeQuery(generatedSql)) {
      throw new Error(
        "Generated query contained forbidden commands or invalid structure.",
      );
    }

    return generatedSql;
  } catch (error) {
    console.error("AI Generation Internal Error:", error);

    if (error.status === 429) {
      throw new Error(
        "API rate limit exceeded. Please wait a moment before trying again.",
      );
    }

    if (error.status === 401) {
      throw new Error("Invalid API key. Please check your .env configuration.");
    }

    if (error.status >= 500) {
      throw new Error(
        "AI service is currently experiencing issues. Please try again later.",
      );
    }

    throw new Error(error.message || "Failed to generate SQL");
  }
}
