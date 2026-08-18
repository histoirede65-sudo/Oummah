import type { ReciterRepository } from '../../../core/repositories';
import { MockReciterDataSource } from '../data/MockReciterDataSource';

export class MockReciterRepository implements ReciterRepository {
  constructor(private readonly dataSource: MockReciterDataSource) {}

  getAll() { return this.dataSource.list(); }
  getById(id: string) { return this.dataSource.get(id); }
}
