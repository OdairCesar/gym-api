import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Renomear admin_approved para approved (aplicável a todos os usuários)
      table.renameColumn('admin_approved', 'approved')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('approved', 'admin_approved')
    })
  }
}
