import { storageService, type StorageServiceContract } from '../../storage';
import type { ListeningSnapshot } from './ListeningSnapshot';

const RESUME_KEY = 'oummah:listening:resume:v1';

export interface ResumeRepository {
  load(): Promise<ListeningSnapshot | null>;
  save(snapshot: ListeningSnapshot): Promise<void>;
  clear(): Promise<void>;
}

/** Local implementation. A future Supabase adapter can implement the same port. */
export class LocalResumeRepository implements ResumeRepository {
  constructor(private readonly storage: StorageServiceContract = storageService) {}

  async load() {
    const snapshot = await this.storage.get<ListeningSnapshot>(RESUME_KEY);
    return snapshot?.version === 1 ? snapshot : null;
  }

  save(snapshot: ListeningSnapshot) {
    return this.storage.set(RESUME_KEY, snapshot);
  }

  clear() {
    return this.storage.remove(RESUME_KEY);
  }
}

export const resumeRepository: ResumeRepository = new LocalResumeRepository();
