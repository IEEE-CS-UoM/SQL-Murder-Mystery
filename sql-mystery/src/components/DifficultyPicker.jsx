import { useMemo, useState } from 'react';
import { MYSTERIES } from '../data/mysteries.js';

const FLAVOR = {
  easy: 'Training wheels for SQL beginners. 10 min • 6 hints.',
  medium: 'Detective mode for players with some SQL. 7 min • 3 hints.',
  hard: 'No mercy. Hidden schema, 1 hint, 4 min. Expert only.',
};

const LEVEL_ART = {
  easy: '/homepage/easy.webp',
  medium: '/homepage/medium.webp',
  hard: '/homepage/hard.webp',
};

const LEVEL_ORDER = ['easy', 'medium', 'hard'];

export default function DifficultyPicker({ onStart }) {
  const [selected, setSelected] = useState('easy');

  const options = useMemo(
    () => LEVEL_ORDER.map((id) => MYSTERIES[id]).filter(Boolean),
    []
  );

  const selectedOption = options.find((option) => option.id === selected);

  return (
    <section className="difficulty-screen">
      <div className="difficulty-shell">
        <div className="difficulty-hero">
          <p>IEEE CS Open Week Edition</p>
          <h1 className="detective-heading">SQL Murder Mystery</h1>
          <span>Learn real SQL by solving a browser-based murder case with an in-memory SQLite database.</span>
        </div>

        <div className="difficulty-grid">
          {options.map((option) => {
            const active = selected === option.id;
            return (
              <article
                key={option.id}
                className={`difficulty-card difficulty-card--${option.id} ${active ? 'is-selected' : ''}`}
                onClick={() => setSelected(option.id)}
              >
                <img
                  className="difficulty-card-art"
                  src={LEVEL_ART[option.id]}
                  alt={`${option.label} difficulty artwork`}
                  loading="lazy"
                />
                <div className="difficulty-card-shade" aria-hidden="true" />
                <div className="difficulty-card-top">
                  <strong className="difficulty-level-title">{option.label}</strong>
                  <span>{Math.floor(option.timeLimit / 60)} min</span>
                </div>
                <div className="difficulty-card-bottom">
                  <p>{option.description}</p>
                  <small>{FLAVOR[option.id]}</small>
                </div>
              </article>
            );
          })}
        </div>

        <div className="difficulty-actions">
          <button
            className="difficulty-start-main"
            onClick={() => onStart(selected)}
            type="button"
          >
            <span aria-hidden="true">🔍</span>
            Start Investigation
            <strong>{selectedOption?.label ?? 'Easy'}</strong>
          </button>
        </div>
      </div>
    </section>
  );
}
