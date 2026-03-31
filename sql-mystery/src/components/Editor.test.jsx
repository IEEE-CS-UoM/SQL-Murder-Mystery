import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Editor from "./Editor";
import * as aiModule from "../services/ai";

vi.mock("../services/ai", () => ({
  generateSQL: vi.fn(),
}));

describe("Editor Component (Natural Language)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("toggles natural language mode", () => {
    render(
      <Editor onChange={vi.fn()} onClear={vi.fn()} onRun={vi.fn()} value="" />,
    );

    // Default is SQL Mode
    expect(screen.getByPlaceholderText(/SELECT \* FROM/i)).toBeInTheDocument();

    const toggleButton = screen.getByText("Natural Language");
    fireEvent.click(toggleButton);

    // After toggle, should show Natural Language input
    expect(
      screen.getByPlaceholderText(/Type your question/i),
    ).toBeInTheDocument();
    expect(screen.getByText("SQL Mode")).toBeInTheDocument();
  });

  it("calls generateSQL and updates the editor", async () => {
    const onChangeMock = vi.fn();
    const runQueryFuncMock = vi.fn();

    aiModule.generateSQL.mockResolvedValueOnce(
      "SELECT * FROM drivers_license;",
    );

    render(
      <Editor
        onChange={onChangeMock}
        onClear={vi.fn()}
        onRun={vi.fn()}
        value=""
        runQueryFunc={runQueryFuncMock}
      />,
    );

    const toggleButton = screen.getByText("Natural Language");
    fireEvent.click(toggleButton);

    const input = screen.getByPlaceholderText(/Type your question/i);
    fireEvent.change(input, { target: { value: "Get all drivers licenses" } });

    const generateBtn = screen.getByText("Generate SQL");
    fireEvent.click(generateBtn);

    expect(generateBtn).toHaveTextContent("Thinking...");

    await waitFor(() => {
      expect(aiModule.generateSQL).toHaveBeenCalledWith(
        "Get all drivers licenses",
        runQueryFuncMock,
      );
      expect(onChangeMock).toHaveBeenCalledWith(
        "SELECT * FROM drivers_license;",
      );
    });

    // Should return to SQL mode
    expect(screen.getByPlaceholderText(/SELECT \* FROM/i)).toBeInTheDocument();
  });
});
