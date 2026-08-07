import type { ReciterRepository } from "../../../core/repositories";
import { QuranFoundationReciterDataSource } from "../data/QuranFoundationReciterDataSource";

export class QuranReciterRepository
  implements ReciterRepository
{
  constructor(
    private readonly dataSource: QuranFoundationReciterDataSource,
  ) {}

  getAll() {
    return this.dataSource.list();
  }

  getById(id: string) {
    return this.dataSource.get(id);
  }
}