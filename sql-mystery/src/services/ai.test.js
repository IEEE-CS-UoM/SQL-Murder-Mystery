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

import { generateSQL, isSafeQuery } from "./ai";

describe("AI Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters unsafe queries correctly", () => {
    expect(isSafeQuery("SELECT * FROM users")).toBe(true);
    expect(isSafeQuery("DROP TABLE users")).toBe(false);
    expect(isSafeQuery("DELETE FROM users")).toBe(false);
    expect(isSafeQuery('UPDATE users SET name = "Test"')).toBe(false);
    expect(isSafeQuery("INSERT INTO users VALUES (1)")).toBe(false);
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
          args: { sql: "SELECT * FROM test" },
        },
      ],
    });

    // 2nd call: AI responds to tool result with final text
    mockSendMessage.mockResolvedValueOnce({
      text: 'SELECT * FROM person WHERE name = "Test";',
      functionCalls: null,
    });

    const runQueryMock = vi.fn().mockReturnValue({
      columns: ["id"],
      rows: [[1]],
    });

    const sql = await generateSQL("Show people", runQueryMock);

    expect(mockSendMessage).toHaveBeenCalledTimes(2);
    expect(runQueryMock).toHaveBeenCalledWith("SELECT * FROM test");
    expect(sql).toBe('SELECT * FROM person WHERE name = "Test";');
  });

  it("handles errors from LLM", async () => {
    mockSendMessage.mockRejectedValueOnce(new Error("I don't understand"));

    await expect(generateSQL("gibberish", vi.fn())).rejects.toThrow(
      "I don't understand",
    );
  });

  it("prevents returning unsafe queries even if LLM hallucinated", async () => {
    mockSendMessage.mockResolvedValueOnce({
      text: "DROP TABLE person;",
      functionCalls: null,
    });

    await expect(generateSQL("destroy database", vi.fn())).rejects.toThrow(
      "Generated query contained forbidden destructive commands.",
    );
  });
});
