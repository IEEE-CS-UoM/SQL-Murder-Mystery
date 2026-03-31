import { useEffect, useState } from "react";
import { generateSQL } from "../services/ai";

export default function Editor({
  onChange,
  onClear,
  onRun,
  playClick,
  playRunQuery,
  textareaRef,
  value,
  runQueryFunc,
}) {
  const [running, setRunning] = useState(false);
  const [nlMode, setNlMode] = useState(false);
  const [nlQuery, setNlQuery] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    textareaRef?.current?.focus();
  }, [textareaRef]);

  const runQuery = async () => {
    if (running) {
      return;
    }

    playRunQuery?.();
    setRunning(true);
    await new Promise((resolve) => setTimeout(resolve, 80));
    onRun();
    setRunning(false);
  };

  const handleGenerate = async () => {
    if (!nlQuery.trim() || generating) return;
    setGenerating(true);
    try {
      const sql = await generateSQL(nlQuery, runQueryFunc);
      onChange(sql);
      setNlMode(false);
      setNlQuery("");
    } catch (err) {
      alert(err.message || "Failed to generate query");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section className="editor-shell panel-section">
      <div className="panel-header">
        <div>
          <strong>Query editor</strong>
          <span style={{ marginLeft: 10 }}>Ctrl+Enter to run</span>
        </div>
        <div className="editor-actions">
          <button
            className={`ghost-button ${nlMode ? "active" : ""}`}
            onClick={() => setNlMode(!nlMode)}
            type="button"
          >
            {nlMode ? "SQL Mode" : "Natural Language"}
          </button>
          <button className="ghost-button" onClick={onClear} type="button">
            Clear
          </button>
          <button
            className="primary-button run-button"
            onClick={runQuery}
            type="button"
          >
            {running && <span className="inline-spinner" />}
            {running ? "Running..." : "Run query"}
          </button>
        </div>
      </div>

      {nlMode ? (
        <div className="nl-input-container">
          <textarea
            className="editor-textarea"
            placeholder="Type your question in plain English (e.g., 'Show me all drivers with a red car')"
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            disabled={generating}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />
          <button
            className="primary-button run-button"
            style={{ position: "absolute", bottom: "1rem", right: "1rem" }}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? "Thinking..." : "Generate SQL"}
          </button>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              runQuery();
              return;
            }

            if (event.key === "Tab") {
              event.preventDefault();
              const { selectionEnd, selectionStart } = event.currentTarget;
              const nextValue = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
              onChange(nextValue);
              requestAnimationFrame(() => {
                if (textareaRef?.current) {
                  textareaRef.current.selectionStart = selectionStart + 2;
                  textareaRef.current.selectionEnd = selectionStart + 2;
                }
              });
            }
          }}
          onKeyUp={(event) => {
            if (
              event.key.length === 1 ||
              event.key === "Backspace" ||
              event.key === "Delete"
            ) {
              playClick?.();
            }
          }}
          placeholder="SELECT * FROM person LIMIT 5;"
          spellCheck={false}
          value={value}
        />
      )}
    </section>
  );
}
