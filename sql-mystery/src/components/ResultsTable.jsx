function EmptyMagnifier() {
  return <span className="magnifier" aria-hidden="true" />;
}

export default function ResultsTable({ result }) {
  if (!result) {
    return (
      <section className="panel-section results-shell results-empty">
        <h3>Ready for your first query</h3>
        <p>Try <code>SELECT * FROM person LIMIT 5;</code> to inspect the witness list.</p>
      </section>
    );
  }

  if (result.error) {
    return (
      <section className="panel-section results-shell results-error">
        <h3>Query error</h3>
        <p>{result.error}</p>
      </section>
    );
  }

  if (result.empty || !result.rows.length) {
    return (
      <section className="panel-section results-shell results-zero">
        <EmptyMagnifier />
        <h3>No rows returned</h3>
        <p>The SQL ran successfully, but nothing matched that query.</p>
      </section>
    );
  }

  return (
    <section className="panel-section results-shell">
      <div className="results-table-wrap">
        <table className="results-table">
          <thead>
            <tr>
              {result.columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, rowIndex) => (
              <tr
                key={`${rowIndex}-${row.join('|')}`}
                style={rowIndex < 10 ? { animationDelay: `${rowIndex * 0.05}s` } : undefined}
              >
                {row.map((cell, cellIndex) => {
                  const isNull = cell === null;
                  const cellValue = isNull ? 'null' : String(cell);
                  return (
                    <td
                      key={`${rowIndex}-${cellIndex}`}
                      title={isNull ? 'null' : String(cell)}
                      className={isNull ? 'is-null' : ''}
                    >
                      {cellValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer>{result.rows.length} rows returned</footer>
    </section>
  );
}
