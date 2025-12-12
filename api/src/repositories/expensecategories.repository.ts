Here is a basic implementation of an ExpenseCategoriesRepository for a TypeScript application. This repository includes methods for creating, reading, updating, and deleting expense categories. It also includes a method for getting all expense categories for a specific tenant.


import { getRepository, Repository } from 'typeorm';
import { ExpenseCategory } from '../entities/ExpenseCategory';

class ExpenseCategoriesRepository {
  private ormRepository: Repository<ExpenseCategory>;

  constructor() {
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

export { ExpenseCategoriesRepository };


Please note that this is a basic implementation and might need adjustments based on your application's specific needs. For example, the `ICreateExpenseCategoryDTO` interface used in the `create` method is not defined in this code. You would need to define it based on the data your application expects when creating a new expense category.

Also, the `ExpenseCategory` entity is used here, which should represent a table in your database. You would need to define this entity according to your database schema.