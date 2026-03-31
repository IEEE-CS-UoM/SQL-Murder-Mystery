import { useMemo, useState } from 'react';

function extractQuery(hint) {
  const start = hint.toUpperCase().indexOf('SELECT');
  const end = hint.lastIndexOf(';');

  if (start === -1 || end === -1 || end < start) {
    return null;
  }

  return hint.slice(start, end + 1);
}

export default function HintPanel({ difficulty, hints, onCopyQuery, onShowNextHint, revealedCount }) {
  const [visibleIndex, setVisibleIndex] = useState(0);

  const revealedHints = useMemo(() => hints.slice(0, revealedCount), [hints, revealedCount]);
  const hasRevealedHints = revealedHints.length > 0;

  const activeIndex = hasRevealedHints ? Math.min(visibleIndex, revealedHints.length - 1) : 0;
  const currentHint = hasRevealedHints ? revealedHints[activeIndex] : null;
  const currentQuery = currentHint ? extractQuery(currentHint) : null;

  const goToPrevious = () => {
    setVisibleIndex((current) => Math.max(0, current - 1));
  };

  const goToNext = () => {
    setVisibleIndex((current) => Math.min(revealedHints.length - 1, current + 1));
  };

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

        {hasRevealedHints && (
          <article className="hint-card" key={`${visibleIndex}-${currentHint}`}>
            <div className="hint-nav">
              <button
                aria-label="Previous hint"
                className="hint-nav-button"
                disabled={activeIndex === 0}
                onClick={goToPrevious}
                type="button"
              >
                ←
              </button>
              <strong>Hint {activeIndex + 1}</strong>
              <button
                aria-label="Next hint"
                className="hint-nav-button"
                disabled={activeIndex >= revealedHints.length - 1}
                onClick={goToNext}
                type="button"
              >
                →
              </button>
            </div>
            <p>{currentHint}</p>
            {currentQuery && (
              <button className="ghost-button" onClick={() => onCopyQuery(currentQuery)} type="button">
                Copy query
              </button>
            )}
          </article>
        )}
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
