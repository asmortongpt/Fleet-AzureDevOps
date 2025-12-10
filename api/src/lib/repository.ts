/**
 * Base Repository Pattern
 * Provides consistent data access layer for all entities
 */

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filters?: Record<string, any>): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

export abstract class Repository<T> implements IRepository<T> {
  protected model: any;

  constructor(model: any) {
    this.model = model;
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findUnique({ where: { id } });
  }

  async findAll(filters?: Record<string, any>): Promise<T[]> {
    return await this.model.findMany({ where: filters || {} });
  }

  async create(data: Partial<T>): Promise<T> {
    return await this.model.create({ data });
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return await this.model.update({ where: { id }, data });
  }

  async delete(id: string): Promise<boolean> {
    await this.model.delete({ where: { id } });
    return true;
  }
}
