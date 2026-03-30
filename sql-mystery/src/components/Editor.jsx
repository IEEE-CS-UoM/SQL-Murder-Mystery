import { useEffect, useState } from 'react';

export default function Editor({ onChange, onClear, onRun, playClick, playRunQuery, textareaRef, value }) {
  const [running, setRunning] = useState(false);

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

  return (
    <section className="editor-shell panel-section">
      <div className="panel-header">
        <div>
          <strong>Query editor</strong>
          <span>Ctrl+Enter to run</span>
        </div>
        <div className="editor-actions">
          <button className="ghost-button" onClick={onClear} type="button">
            Clear
          </button>
          <button className="primary-button run-button" onClick={runQuery} type="button">
            {running && <span className="inline-spinner" />}
            {running ? 'Running...' : 'Run query'}
          </button>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        className="editor-textarea"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            runQuery();
            return;
          }

          if (event.key === 'Tab') {
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
          if (event.key.length === 1 || event.key === 'Backspace' || event.key === 'Delete') {
            playClick?.();
          }
        }}
        placeholder="SELECT * FROM person LIMIT 5;"
        spellCheck={false}
        value={value}
      />
    </section>
  );
}
