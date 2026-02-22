import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'exercises'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('reps').notNullable()
      table.enum('type', ['aerobico', 'musculacao', 'flexibilidade', 'outro']).notNullable()
      table.decimal('weight', 8, 2).notNullable().defaultTo(0)
      table.integer('rest_seconds').notNullable().defaultTo(0)
      table.string('video_link').nullable()
      table.integer('priority').notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
