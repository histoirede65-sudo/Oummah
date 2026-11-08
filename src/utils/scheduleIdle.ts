type IdleCallback = () => void;

type IdleScheduler = {
  requestIdleCallback?: (callback: IdleCallback) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const idleScheduler = globalThis as typeof globalThis & IdleScheduler;

/**
 * Lance `callback` quand le JS est libre, et au plus tard après `maxDelay` ms.
 * Sans ce délai maximal, un Android lent ou une animation continue (orbite des prières) ne laisse jamais
 * le JS « au repos » : le rappel ne partait pas et les pastilles de prière n'étaient jamais affichées.
 */
export function scheduleIdle(callback: IdleCallback, maxDelay = 300) {
  let done = false;
  let idleHandle: number | null = null;
  const run = () => {
    if (done) return;
    done = true;
    clearTimeout(fallback);
    if (idleHandle !== null) idleScheduler.cancelIdleCallback?.(idleHandle);
    callback();
  };
  const fallback = setTimeout(run, maxDelay);
  if (idleScheduler.requestIdleCallback) idleHandle = idleScheduler.requestIdleCallback(run);
  return {
    cancel: () => {
      done = true;
      clearTimeout(fallback);
      if (idleHandle !== null) idleScheduler.cancelIdleCallback?.(idleHandle);
    },
  };
}
