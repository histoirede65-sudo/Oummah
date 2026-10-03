type Listener = (individualPrayerCelebrationActive: boolean) => void;

let individualPrayerCelebrationActive = false;
const listeners = new Set<Listener>();

export function isIndividualPrayerCelebrationActive() {
  return individualPrayerCelebrationActive;
}

export function setIndividualPrayerCelebrationActive(active: boolean) {
  if (individualPrayerCelebrationActive === active) return;
  individualPrayerCelebrationActive = active;
  listeners.forEach((listener) => listener(active));
}

export function subscribeCelebrationCoordinator(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
