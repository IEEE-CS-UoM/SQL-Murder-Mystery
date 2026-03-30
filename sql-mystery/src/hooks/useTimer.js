import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function formatTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function useTimer(limit = null, onExpire) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  const intervalRef = useRef(null);
  const startRef = useRef(0);
  const carriedRef = useRef(0);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const stopInternal = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const now = performance.now();
    const nextElapsed = carriedRef.current + (now - startRef.current);

    if (limit !== null && nextElapsed >= limit * 1000) {
      const capped = limit * 1000;
      carriedRef.current = capped;
      setElapsed(capped);
      setRunning(false);
      stopInternal();

      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
      return;
    }

    setElapsed(nextElapsed);
  }, [limit, stopInternal]);

  const start = useCallback(() => {
    if (running) {
      return;
    }

    expiredRef.current = false;
    startRef.current = performance.now();
    setRunning(true);
    stopInternal();
    intervalRef.current = setInterval(tick, 100);
  }, [running, stopInternal, tick]);

  const stop = useCallback(() => {
    if (!running) {
      return;
    }

    carriedRef.current += performance.now() - startRef.current;
    setElapsed(carriedRef.current);
    setRunning(false);
    stopInternal();
  }, [running, stopInternal]);

  const reset = useCallback(() => {
    stopInternal();
    carriedRef.current = 0;
    startRef.current = 0;
    expiredRef.current = false;
    setElapsed(0);
    setRunning(false);
  }, [stopInternal]);

  useEffect(() => () => stopInternal(), [stopInternal]);

  const remaining = useMemo(() => {
    if (limit === null) {
      return null;
    }

    return Math.max(0, limit * 1000 - elapsed);
  }, [elapsed, limit]);

  const display = useMemo(() => formatTime(remaining ?? elapsed), [elapsed, remaining]);

  return {
    elapsed,
    display,
    remaining,
    running,
    start,
    stop,
    reset,
  };
}
