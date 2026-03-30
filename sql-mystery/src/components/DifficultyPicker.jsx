import { useMemo, useState } from 'react';
import { MYSTERIES } from '../data/mysteries.js';

const FLAVOR = {
  easy: 'Training wheels — perfect for SQL beginners. 10 min. 6 hints.',
  medium: 'Detective mode — you know some SQL. 7 min. 3 hints.',
  hard: 'No mercy — schema hidden, 1 hint, 4 minutes. Expert only.',
};

export default function DifficultyPicker({ onStart }) {
  const [selected, setSelected] = useState('easy');

  const options = useMemo(() => Object.values(MYSTERIES), []);

  return (
    <section className="difficulty-screen">
      <div className="difficulty-hero">
        <p>IEEE CS Open Week Edition</p>
        <h1>SQL Murder Mystery</h1>
        <span>Learn real SQL by solving a browser-based murder case with an in-memory SQLite database.</span>
      </div>

      <div className="difficulty-grid">
        {options.map((option) => {
          const active = selected === option.id;
          return (
            <button
              key={option.id}
              className={`difficulty-card ${active ? 'is-selected' : ''}`}
              onClick={() => setSelected(option.id)}
              type="button"
            >
              <div className="difficulty-card-header">
                <strong>{option.label}</strong>
                <span>{Math.floor(option.timeLimit / 60)} min</span>
              </div>
              <p>{option.description}</p>
              <small>{FLAVOR[option.id]}</small>
            </button>
          );
        })}
      </div>

      <button className="primary-button difficulty-start" onClick={() => onStart(selected)} type="button">
        Start investigation
      </button>
    </section>
  );
}
