const STATUS_STYLES = {
  'Case Open': ['var(--blue)', 'var(--blue-bg)'],
  'Suspect Found': ['var(--amber)', 'var(--amber-bg)'],
  'Case Solved': ['var(--green)', 'var(--green-bg)'],
  'Time Expired': ['var(--red)', 'var(--red-bg)'],
};

const DIFFICULTY_STYLES = {
  easy: ['var(--green)', 'var(--green-bg)'],
  medium: ['var(--amber)', 'var(--amber-bg)'],
  hard: ['var(--red)', 'var(--red-bg)'],
};

export default function Header({ difficulty, muted, onQuit, onShowHelp, onToggleMute, status, timer }) {
  const [statusColor, statusBackground] = STATUS_STYLES[status] ?? STATUS_STYLES['Case Open'];
  const [difficultyColor, difficultyBackground] = DIFFICULTY_STYLES[difficulty.id] ?? DIFFICULTY_STYLES.easy;

  let timerClassName = 'header-timer';
  if (timer.running) {
    timerClassName += ' is-running';
  }

  if (timer.remaining !== null && timer.remaining <= 60000) {
    timerClassName += ' is-warning';
  }

  if (timer.remaining !== null && timer.remaining <= 30000) {
    timerClassName += ' is-danger';
  }

  return (
    <header className="header">
      <div className="header-brand">
        <span className="header-brand-mark">IEEE CS</span>
        <div>
          <div className="header-title">SQL Murder Mystery</div>
          <div className="header-subtitle">Open Week investigation terminal</div>
        </div>
      </div>

      <div className={timerClassName}>{timer.display}</div>

      <div className="header-actions">
        <span
          className="badge"
          style={{
            color: difficultyColor,
            background: difficultyBackground,
            borderColor: `${difficultyColor}55`,
          }}
        >
          {difficulty.label}
        </span>
        <span
          className="badge"
          style={{
            color: statusColor,
            background: statusBackground,
            borderColor: `${statusColor}55`,
          }}
        >
          {status}
        </span>
        <button className="icon-button" onClick={onToggleMute} title={muted ? 'Unmute sounds' : 'Mute sounds'} type="button">
          {muted ? 'Mute' : 'Sound'}
        </button>
        <button className="icon-button" onClick={onShowHelp} title="Keyboard shortcuts" type="button">
          ?
        </button>
        <button className="icon-button" onClick={onQuit} title="Return to difficulty selection" type="button">
          Quit
        </button>
      </div>
    </header>
  );
}
