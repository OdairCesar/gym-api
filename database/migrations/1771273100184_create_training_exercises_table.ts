import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'training_exercise'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('training_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('trainings')
        .onDelete('CASCADE')
      table
        .integer('exercise_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('exercises')
        .onDelete('CASCADE')

      // Pivot columns - campos personalizados do exercício no treino
      table.string('name').nullable()
      table.string('reps').nullable()
      table.enum('type', ['aerobico', 'musculacao', 'flexibilidade', 'outro']).nullable()
      table.decimal('weight', 8, 2).nullable()
      table.integer('rest_seconds').nullable()
      table.string('video_link').nullable()
      table.integer('priority').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
