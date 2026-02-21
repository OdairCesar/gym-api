import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'userpermissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Cliente que está dando a permissão
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // Quem está recebendo a permissão (academia ou personal)
      // Se grantee_type = 'gym', grantee_id referencia gyms
      // Se grantee_type = 'personal', grantee_id referencia users
      table.enum('grantee_type', ['gym', 'personal']).notNullable()
      table.integer('grantee_id').unsigned().notNullable()

      // Tipos de permissão
      table.boolean('can_edit_diets').notNullable().defaultTo(false)
      table.boolean('can_edit_trainings').notNullable().defaultTo(false)

      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      // Evita duplicatas
      table.unique(['user_id', 'grantee_type', 'grantee_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
