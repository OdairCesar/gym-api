import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'gympermissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Academia que está dando a permissão
      table
        .integer('gym_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('gyms')
        .onDelete('CASCADE')

      // Personal/Coach que está recebendo a permissão
      table
        .integer('personal_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // Tipos de permissão
      table.boolean('can_edit_diets').notNullable().defaultTo(false)
      table.boolean('can_edit_trainings').notNullable().defaultTo(false)

      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      // Evita duplicatas
      table.unique(['gym_id', 'personal_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
