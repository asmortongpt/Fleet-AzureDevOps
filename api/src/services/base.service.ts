export abstract class BaseService {
  protected constructor() {}

  abstract validate(data: any): Promise<void>;

  protected async executeInTransaction<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    // Transaction wrapper for database operations
    return operation();
  }
}