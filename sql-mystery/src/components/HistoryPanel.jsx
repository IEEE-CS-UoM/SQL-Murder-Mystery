function formatHistoryTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function truncateQuery(query) {
  return query.length > 72 ? `${query.slice(0, 72)}...` : query;
}

export default function HistoryPanel({ history, onClear, onLoad }) {
  return (
    <section className="side-panel-content">
      <div className="section-head">
        <strong>Recent queries</strong>
        <span>Last 20 runs</span>
      </div>

      <div className="history-list">
        {!history.length && <p className="empty-copy">Run a query to build your investigation history.</p>}

        {[...history].reverse().map((entry) => (
          <button
            className={`history-item is-${entry.status}`}
            key={entry.id}
            onClick={() => onLoad(entry.query)}
            title={entry.query}
            type="button"
          >
            <div>
              <strong>{formatHistoryTime(entry.timestamp)}</strong>
              <span>{truncateQuery(entry.query)}</span>
            </div>
            <em>▶</em>
          </button>
        ))}
      </div>

      <div className="section-actions">
        <button
          className="ghost-button"
          onClick={() => {
            if (window.confirm('Clear the query history for this run?')) {
              onClear();
            }
          }}
          type="button"
        >
          Clear history
        </button>
      </div>
    </section>
  );
}
