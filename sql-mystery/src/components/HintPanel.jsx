function extractQuery(hint) {
  const start = hint.toUpperCase().indexOf('SELECT');
  const end = hint.lastIndexOf(';');

  if (start === -1 || end === -1 || end < start) {
    return null;
  }

  return hint.slice(start, end + 1);
}

export default function HintPanel({ difficulty, hints, onCopyQuery, onShowNextHint, revealedCount }) {
  return (
    <section className="sidebar-section hint-section">
      <div className="sidebar-header">
        <div>
          <strong>Hints</strong>
          <span>Hint {revealedCount} / {difficulty.hintCount}</span>
        </div>
      </div>

      <div className="hint-list">
        {!revealedCount && (
          <p className="hint-placeholder">Reveal hints one at a time if you need a nudge.</p>
        )}

        {hints.slice(0, revealedCount).map((hint, index) => {
          const query = extractQuery(hint);
          return (
            <article className="hint-card" key={`${index}-${hint}`}>
              <strong>Hint {index + 1}</strong>
              <p>{hint}</p>
              {query && (
                <button className="ghost-button" onClick={() => onCopyQuery(query)} type="button">
                  Copy query
                </button>
              )}
            </article>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <button
          className="secondary-button hint-button"
          disabled={revealedCount >= hints.length}
          onClick={onShowNextHint}
          type="button"
        >
          {difficulty.id === 'hard' && revealedCount === 0
            ? 'Use your one hint (are you sure?)'
            : revealedCount >= hints.length
              ? 'All hints used'
              : 'Show next hint'}
        </button>
      </div>
    </section>
  );
}
