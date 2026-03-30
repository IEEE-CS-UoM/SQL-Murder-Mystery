import { useCallback, useMemo, useRef, useState } from 'react';
import useSound from 'use-sound';

const STORAGE_KEY = 'sql-mystery-muted';
const SOUND_PATHS = {
  click: '/sounds/keyclick.mp3',
  runQuery: '/sounds/run-query.mp3',
  success: '/sounds/success.mp3',
  wrong: '/sounds/wrong.mp3',
  victory: '/sounds/victory.mp3',
};

function getAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return null;
  }

  if (!window.__sqlMysteryAudioContext) {
    window.__sqlMysteryAudioContext = new AudioCtx();
  }

  return window.__sqlMysteryAudioContext;
}

function resumeAudioContext(context) {
  if (context && context.state === 'suspended') {
    context.resume().catch(() => {});
  }
}

function generateTone(frequency, duration, type = 'sine', gain = 0.2, startAt = 0, sweepTo = null) {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  resumeAudioContext(context);

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const startTime = context.currentTime + startAt;
  const endTime = startTime + duration / 1000;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  if (sweepTo !== null) {
    oscillator.frequency.linearRampToValueAtTime(sweepTo, endTime);
  }

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(endTime);
}

function playWrongTone() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  resumeAudioContext(context);

  const oscillator = context.createOscillator();
  const shaper = context.createWaveShaper();
  const gainNode = context.createGain();
  const startTime = context.currentTime;
  const endTime = startTime + 0.2;
  const samples = 256;
  const curve = new Float32Array(samples);

  for (let index = 0; index < samples; index += 1) {
    const value = (index * 2) / samples - 1;
    curve[index] = (Math.PI + 8) * value / (Math.PI + 8 * Math.abs(value));
  }

  shaper.curve = curve;
  shaper.oversample = '4x';

  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(150, startTime);
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(shaper);
  shaper.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(endTime);
}

function playArpeggio(notes, noteDuration, gain, sustain = 0) {
  notes.forEach((frequency, index) => {
    const offset = index * (noteDuration / 1000);
    generateTone(frequency, noteDuration + sustain, 'triangle', gain, offset);
  });
}

function useManagedSound(path, options = {}) {
  const failedRef = useRef(false);
  const loadedRef = useRef(false);

  const [play] = useSound(path, {
    ...options,
    onload: () => {
      failedRef.current = false;
      loadedRef.current = true;
      options.onload?.();
    },
    onloaderror: () => {
      failedRef.current = true;
    },
  });

  return {
    play,
    failedRef,
    loadedRef,
  };
}

export function useSoundEffects() {
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const enabled = !muted;

  const clickSound = useManagedSound(SOUND_PATHS.click, { interrupt: true, soundEnabled: enabled, volume: 0.2 });
  const runSound = useManagedSound(SOUND_PATHS.runQuery, { interrupt: true, soundEnabled: enabled, volume: 0.35 });
  const successSound = useManagedSound(SOUND_PATHS.success, { interrupt: true, soundEnabled: enabled, volume: 0.45 });
  const wrongSound = useManagedSound(SOUND_PATHS.wrong, { interrupt: true, soundEnabled: enabled, volume: 0.45 });
  const victorySound = useManagedSound(SOUND_PATHS.victory, { interrupt: true, soundEnabled: enabled, volume: 0.55 });

  const playWithFallback = useCallback((managedSound, fallback) => {
    if (muted) {
      return;
    }

    if (managedSound.failedRef.current || !managedSound.loadedRef.current) {
      fallback();
      return;
    }

    try {
      managedSound.play();
    } catch {
      fallback();
    }
  }, [muted]);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Ignore storage failures.
      }
      return next;
    });
  }, []);

  const api = useMemo(() => ({
    muted,
    toggleMute,
    playClick: () => playWithFallback(clickSound, () => generateTone(800, 30, 'sine', 0.1)),
    playRunQuery: () => playWithFallback(runSound, () => generateTone(400, 80, 'sine', 0.15, 0, 800)),
    playSuccess: () => playWithFallback(successSound, () => playArpeggio([523.25, 659.25, 783.99], 120, 0.2)),
    playWrong: () => playWithFallback(wrongSound, playWrongTone),
    playVictory: () => playWithFallback(victorySound, () => playArpeggio([523.25, 659.25, 783.99, 1046.5], 150, 0.25, 120)),
  }), [clickSound, muted, playWithFallback, runSound, successSound, toggleMute, victorySound, wrongSound]);

  return api;
}
