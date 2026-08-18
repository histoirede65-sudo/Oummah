import type { SleepTimerOption } from './types';

export class SleepTimerService {
  private timer: ReturnType<typeof setTimeout> | null = null;

  schedule(option: SleepTimerOption, onExpire: () => void) {
    this.cancel();
    if (option === null || option === 'endOfSurah') return;
    this.timer = setTimeout(() => {
      this.timer = null;
      onExpire();
    }, option * 60 * 1_000);
  }

  cancel() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}
