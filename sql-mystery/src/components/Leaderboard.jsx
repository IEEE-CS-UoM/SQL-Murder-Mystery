import { useState } from 'react';
import { clearLeaderboard, loadLeaderboard } from '../data/leaderboard.js';
const DIFFICULTIES = ['easy', 'medium', 'hard'];

function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function Leaderboard({ currentScore }) {
  const [tab, setTab] = useState('easy');
  const [refreshKey, setRefreshKey] = useState(0);
  void refreshKey;

  const visibleEntries = loadLeaderboard()
    .filter((entry) => entry.difficulty === tab)
    .sort((left, right) => left.time - right.time)
    .slice(0, 10);

  return (
    <section className="side-panel-content" id="leaderboard-panel">
      <div className="section-head">
        <strong>Leaderboard</strong>
        <span>Top 10 per difficulty</span>
      </div>

      <div className="leaderboard-tabs">
        {DIFFICULTIES.map((difficulty) => (
          <button
            key={difficulty}
            className={`leaderboard-tab ${tab === difficulty ? 'is-active' : ''}`}
            onClick={() => setTab(difficulty)}
            type="button"
          >
            {difficulty}
          </button>
        ))}
      </div>

      {!visibleEntries.length ? (
        <p className="empty-copy">No scores saved for this difficulty yet.</p>
      ) : (
        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Time</th>
                <th>Difficulty</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {visibleEntries.map((entry, index) => {
                const isCurrent =
                  currentScore &&
                  currentScore.name === entry.name &&
                  currentScore.time === entry.time &&
                  currentScore.difficulty === entry.difficulty &&
                  currentScore.date === entry.date;

                return (
                  <tr className={isCurrent ? 'is-current-score' : ''} key={`${entry.name}-${entry.time}-${entry.date}-${index}`}>
                    <td>{index + 1}</td>
                    <td>{entry.name}</td>
                    <td>{formatTime(entry.time)}</td>
                    <td>{entry.difficulty}</td>
                    <td>{entry.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="section-actions">
        <button
          className="ghost-button"
          onClick={() => {
            if (!window.confirm('Clear every saved leaderboard score?')) {
              return;
            }

            clearLeaderboard();
            setRefreshKey((current) => current + 1);
          }}
          type="button"
        >
          Clear scores
        </button>
      </div>
    </section>
  );
}
