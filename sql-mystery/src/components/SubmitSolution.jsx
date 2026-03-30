import { useRef, useState } from 'react';
import confetti from 'canvas-confetti';

function normalize(value) {
  return value.trim().toLowerCase();
}

function burstConfetti() {
  confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.7 },
    colors: ['#57ab5a', '#4184e4', '#E87722', '#986ee2'],
  });
}

export default function SubmitSolution({
  layer1Solved,
  onLayer1Solved,
  onLayer2Solved,
  playSuccess,
  playWrong,
  solution,
}) {
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = () => {
    const attempt = normalize(value);

    if (attempt === normalize(solution.mastermind)) {
      playSuccess?.();
      burstConfetti();
      onLayer2Solved();
      return;
    }

    if (attempt === normalize(solution.killer)) {
      if (!layer1Solved) {
        playSuccess?.();
        burstConfetti();
        onLayer1Solved();
        setFeedback({
          kind: 'success',
          text: 'Jeremy Bowers is the killer. Now identify who hired him.',
        });
        setValue('');
        requestAnimationFrame(() => inputRef.current?.focus());
      } else {
        setFeedback({
          kind: 'info',
          text: 'You already found the killer. Enter the mastermind next.',
        });
      }
      return;
    }

    playWrong?.();
    setFeedback({
      kind: 'error',
      text: 'Wrong suspect. Keep digging.',
    });
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  return (
    <section className="side-panel-content">
      <div className="section-head">
        <strong>Submit solution</strong>
        <span>{layer1Solved ? 'Layer 2: mastermind' : 'Layer 1: killer'}</span>
      </div>

      {feedback && (
        <div className={`submit-feedback is-${feedback.kind}`}>
          {feedback.text}
        </div>
      )}

      <div className={shake ? 'submit-stack is-shaking' : 'submit-stack'}>
        <label className="submit-label" htmlFor="suspect-name">
          {layer1Solved ? "Enter the mastermind's full name" : "Enter the killer's full name"}
        </label>
        <input
          id="suspect-name"
          ref={inputRef}
          className="submit-input"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleSubmit();
            }
          }}
          placeholder={layer1Solved ? 'Miranda Priestly' : 'Jeremy Bowers'}
          type="text"
          value={value}
        />
        <button className="primary-button" onClick={handleSubmit} type="button">
          {layer1Solved ? 'Reveal mastermind' : 'Submit suspect'}
        </button>
      </div>
    </section>
  );
}
