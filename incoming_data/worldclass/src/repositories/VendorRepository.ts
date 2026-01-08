export class VendorRepository {
  async getAll() { return [] }
  async getById(id: string) { return null }
  async create(data: unknown) { return data }
  async update(id: string, data: unknown) { return data }
  async delete(id: string) { return true }
}
