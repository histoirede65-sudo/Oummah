import type { ReciterRepository } from '../../../core/repositories';

export class ReciterService {
  constructor(private readonly repository: ReciterRepository) {}

  list() {
    return this.repository.getAll();
  }

  get(id: string) {
    return this.repository.getById(id);
  }
}
