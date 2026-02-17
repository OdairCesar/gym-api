import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Super user - único que pode criar gyms
      table.boolean('is_super').notNullable().defaultTo(false).after('is_personal')

      // Aprovação de admin - novos admins precisam ser aprovados
      table.boolean('admin_approved').notNullable().defaultTo(true).after('is_super')

      // Quem aprovou o admin
      table.integer('approved_by').unsigned().nullable().after('admin_approved')
      table.foreign('approved_by').references('id').inTable('users').onDelete('SET NULL')

      // Quando foi aprovado
      table.timestamp('approved_at').nullable().after('approved_by')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['approved_by'])
      table.dropColumn('approved_at')
      table.dropColumn('approved_by')
      table.dropColumn('admin_approved')
      table.dropColumn('is_super')
    })
  }
}
