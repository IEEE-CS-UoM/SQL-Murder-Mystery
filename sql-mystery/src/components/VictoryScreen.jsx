import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { saveScore } from '../data/leaderboard.js';

function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function VictoryScreen({ difficulty, elapsed, onPlayAgain, onViewLeaderboard, solution }) {
  const [playerName, setPlayerName] = useState('');
  const [savedEntry, setSavedEntry] = useState(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) {
      return;
    }

    firedRef.current = true;

    const duration = 2200;
    const endAt = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 8,
        spread: 70,
        origin: { x: 0.1, y: 0.65 },
        colors: ['#57ab5a', '#4184e4', '#E87722', '#986ee2'],
      });

      confetti({
        particleCount: 8,
        spread: 70,
        origin: { x: 0.9, y: 0.65 },
        colors: ['#57ab5a', '#4184e4', '#E87722', '#986ee2'],
      });

      if (Date.now() < endAt) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
  }, []);

  const handleSave = () => {
    if (!playerName.trim() || savedEntry) {
      return;
    }

    const entry = {
      name: playerName.trim(),
      time: elapsed,
      difficulty: difficulty.id,
      date: new Date().toLocaleDateString(),
    };

    saveScore(entry);
    setSavedEntry(entry);
  };

  return (
    <div className="victory-overlay">
      <div className="victory-card">
        <p className="victory-kicker">Case Closed</p>
        <h2>SQL City is safe again.</h2>

        <div className="victory-summary">
          <div><span>Killer</span><strong>{solution.killer}</strong></div>
          <div><span>Mastermind</span><strong>{solution.mastermind}</strong></div>
          <div><span>Time</span><strong>{formatTime(elapsed)}</strong></div>
          <div><span>Difficulty</span><strong>{difficulty.label}</strong></div>
        </div>

        <div className="victory-save">
          <label htmlFor="player-name">Save your score</label>
          <div className="victory-save-row">
            <input
              id="player-name"
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="Enter your name"
              type="text"
              value={playerName}
            />
            <button className="secondary-button" disabled={Boolean(savedEntry)} onClick={handleSave} type="button">
              {savedEntry ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div className="victory-actions">
          <button className="primary-button" onClick={onPlayAgain} type="button">
            Play again
          </button>
          <button className="ghost-button" onClick={() => onViewLeaderboard(savedEntry)} type="button">
            View leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
