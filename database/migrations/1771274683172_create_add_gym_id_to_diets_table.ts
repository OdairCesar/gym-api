import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'diets'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('gym_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('gyms')
        .onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('gym_id')
    })
  }
}
