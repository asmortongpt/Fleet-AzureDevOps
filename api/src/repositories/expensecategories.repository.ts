import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';

export class ExpenseCategoriesRepository extends BaseRepository<any> {
  constructor(pool: Pool) {
    super(pool, 'LExpense_LCategories_s');
  }

  private ormRepository: Repository<ExpenseCategory>;

    this.ormRepository = getRepository(ExpenseCategory);
  }

  public async findAll(tenant_id: string): Promise<ExpenseCategory[]> {
    const expenseCategories = await this.ormRepository.find({ where: { tenant_id } });
    return expenseCategories;
  }

  public async findById(id: string, tenant_id: string): Promise<ExpenseCategory | undefined> {
    const expenseCategory = await this.ormRepository.findOne({ where: { id, tenant_id } });
    return expenseCategory;
  }

  public async create(expenseCategoryData: ICreateExpenseCategoryDTO): Promise<ExpenseCategory> {
    const expenseCategory = this.ormRepository.create(expenseCategoryData);
    await this.ormRepository.save(expenseCategory);
    return expenseCategory;
  }

  public async update(expenseCategory: ExpenseCategory): Promise<ExpenseCategory> {
    return this.ormRepository.save(expenseCategory);
  }

  public async delete(id: string, tenant_id: string): Promise<void> {
    await this.ormRepository.delete({ id, tenant_id });
  }
}

  /**
   * N+1 PREVENTION: Find with related data
   * Override this method in subclasses for specific relationships
   */
  async findWithRelatedData(id: string, tenantId: string) {
    const query = `
      SELECT t.*
      FROM ${this.tableName} t
      WHERE t.id = $1 AND t.tenant_id = $2 AND t.deleted_at IS NULL
    `;
    const result = await this.query(query, [id, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * N+1 PREVENTION: Find all with related data
   * Override this method in subclasses for specific relationships
   */
  async findAllWithRelatedData(tenantId: string) {
    const query = `
      SELECT t.*
      FROM ${this.tableName} t
      WHERE t.tenant_id = $1 AND t.deleted_at IS NULL
      ORDER BY t.created_at DESC
    `;
    const result = await this.query(query, [tenantId]);
    return result.rows;
  }
