import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSendMessage, mockCreateChat } = vi.hoisted(() => {
  const mockSendMessage = vi.fn();
  return {
    mockSendMessage,
    mockCreateChat: vi.fn().mockReturnValue({ sendMessage: mockSendMessage }),
  };
});

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class {
      constructor() {
        this.models = { generateContent: vi.fn() };
        this.chats = { create: mockCreateChat };
      }
    },
  };
});

import { generateSQL, extractSQL } from "./ai";

describe("AI Service (generateSQL & extractSQL)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_GEMINI_API_KEY", "test-key");
  });

  it("extracts SQL from markdown correctly", () => {
    expect(extractSQL("```sql\nSELECT * FROM test;\n```")).toBe(
      "SELECT * FROM test;",
    );
    expect(extractSQL("  ```\nSELECT 1;\n```  ")).toBe("SELECT 1;");
    expect(extractSQL("SELECT * FROM foo;")).toBe("SELECT * FROM foo;");
    expect(extractSQL("  \nSELECT 2; \n ")).toBe("SELECT 2;");
  });

  it("generates safe SQL successfully without tool calling", async () => {
    mockSendMessage.mockResolvedValueOnce({
      text: "```sql\nSELECT * FROM person;\n```",
      functionCalls: null,
    });

    const runQueryMock = vi.fn();
    const sql = await generateSQL("Show everyone", runQueryMock);

    expect(sql).toBe("SELECT * FROM person;");
    expect(runQueryMock).not.toHaveBeenCalled();
  });

  it("executes the agentic loop when test_query is called", async () => {
    // 1st call: AI asks to test query
    mockSendMessage.mockResolvedValueOnce({
      text: null,
      functionCalls: [
        {
          name: "test_query",
          args: { sql: "SELECT * FROM person;" },
        },
      ],
    });

    // 2nd call: AI responds to tool result with final text
    mockSendMessage.mockResolvedValueOnce({
      text: "```sql\nSELECT * FROM person WHERE name = 'Test';\n```",
      functionCalls: null,
    });

    const runQueryMock = vi.fn().mockReturnValue({
      columns: ["id"],
      rows: [[1]],
    });

    const sql = await generateSQL("Show people", runQueryMock);

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(runQueryMock).toHaveBeenCalledWith("SELECT * FROM person;");
    expect(sql).toBe("SELECT * FROM person WHERE name = 'Test';");
  });

  it("handles errors from LLM gracefully", async () => {
    mockSendMessage.mockRejectedValueOnce(new Error("I don't understand"));
    await expect(generateSQL("gibberish", vi.fn())).rejects.toThrow(
      "I don't understand",
    );
  });

  it("prevents returning unsafe queries even if LLM hallucinated them", async () => {
    mockSendMessage.mockResolvedValueOnce({
      text: "DROP TABLE person;",
      functionCalls: null,
    });

    await expect(generateSQL("destroy database", vi.fn())).rejects.toThrow(
      "Generated query contained forbidden commands or invalid structure.",
    );
  });

  it("fails if VITE_GEMINI_API_KEY is not provided", async () => {
    vi.stubEnv("VITE_GEMINI_API_KEY", "");

    // reset module cache to test initialization
    const aiModule = await import("./ai.js?update=" + Date.now());
    await expect(aiModule.generateSQL("test", vi.fn())).rejects.toThrow(
      "Missing VITE_GEMINI_API_KEY",
    );
  });

  it("fails if the response is completely empty", async () => {
    mockSendMessage.mockResolvedValueOnce({
      text: "   ",
      functionCalls: null,
    });

    await expect(generateSQL("anything", vi.fn())).rejects.toThrow(
      "Model did not return SQL.",
    );
  });
});
