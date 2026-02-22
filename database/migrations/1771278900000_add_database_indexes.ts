import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Users table indexes
    this.schema.alterTable('users', (table) => {
      table.index('gym_id', 'users_gym_id_index')
      table.index('email', 'users_email_index')
    })

    // Diets table indexes
    this.schema.alterTable('diets', (table) => {
      table.index('gym_id', 'diets_gym_id_index')
      table.index('creator_id', 'diets_creator_id_index')
    })

    // Meals table indexes
    this.schema.alterTable('meals', (table) => {
      table.index('diet_id', 'meals_diet_id_index')
    })

    // Foods table indexes
    this.schema.alterTable('foods', (table) => {
      table.index('meal_id', 'foods_meal_id_index')
    })

    // Trainings table indexes
    this.schema.alterTable('trainings', (table) => {
      table.index('gym_id', 'trainings_gym_id_index')
      table.index('user_id', 'trainings_user_id_index')
      table.index('coach_id', 'trainings_coach_id_index')
      table.index(['gym_id', 'user_id'], 'trainings_gym_user_index')
    })

    // Exercises table indexes (tabela global, sem gym_id)
    this.schema.alterTable('exercises', (table) => {
      table.index('type', 'exercises_type_index')
      table.index('priority', 'exercises_priority_index')
    })

    // Training_Exercise pivot table indexes
    this.schema.alterTable('trainingexercise', (table) => {
      table.index('training_id', 'trainingexercise_training_id_index')
      table.index('exercise_id', 'trainingexercise_exercise_id_index')
    })

    // Products table indexes
    this.schema.alterTable('products', (table) => {
      table.index('gym_id', 'products_gym_id_index')
      table.index('category', 'products_category_index')
      table.index('published', 'products_published_index')
      table.index(['gym_id', 'code'], 'products_gym_code_unique') // Unique per gym
    })

    // Gyms table indexes
    this.schema.alterTable('gyms', (table) => {
      table.index('published', 'gyms_published_index')
      table.index('created_at', 'gyms_created_at_index')
    })

    // Gym Permissions table indexes
    this.schema.alterTable('gympermissions', (table) => {
      table.index('gym_id', 'gympermissions_gym_id_index')
      table.index('personal_id', 'gympermissions_personal_id_index')
      table.index('is_active', 'gympermissions_is_active_index')
    })

    // User Permissions table indexes
    this.schema.alterTable('userpermissions', (table) => {
      table.index('user_id', 'userpermissions_user_id_index')
      table.index('grantee_type', 'userpermissions_grantee_type_index')
      table.index('grantee_id', 'userpermissions_grantee_id_index')
      table.index('is_active', 'userpermissions_is_active_index')
      table.index(['grantee_id', 'grantee_type'], 'userpermissions_grantee_index')
      table.index(['user_id', 'grantee_id'], 'userpermissions_user_grantee_index')
    })

    // Access Tokens table indexes
    this.schema.alterTable('auth_access_tokens', (table) => {
      table.index('tokenable_id', 'access_tokens_tokenable_id_index')
      table.index('expires_at', 'access_tokens_expires_at_index')
      table.index(['tokenable_id', 'expires_at'], 'access_tokens_tokenable_expires_index')
    })

    // Rate Limits table indexes (já tem PRIMARY KEY em 'key')
    this.schema.alterTable('rate_limits', (table) => {
      table.index('expire', 'rate_limits_expire_index')
    })
  }

  async down() {
    // Users
    this.schema.alterTable('users', (table) => {
      table.dropIndex('gym_id', 'users_gym_id_index')
      table.dropIndex('email', 'users_email_index')
    })

    // Diets
    this.schema.alterTable('diets', (table) => {
      table.dropIndex('gym_id', 'diets_gym_id_index')
      table.dropIndex('creator_id', 'diets_creator_id_index')
    })

    // Meals
    this.schema.alterTable('meals', (table) => {
      table.dropIndex('diet_id', 'meals_diet_id_index')
    })

    // Foods
    this.schema.alterTable('foods', (table) => {
      table.dropIndex('meal_id', 'foods_meal_id_index')
    })

    // Trainings
    this.schema.alterTable('trainings', (table) => {
      table.dropIndex('gym_id', 'trainings_gym_id_index')
      table.dropIndex('user_id', 'trainings_user_id_index')
      table.dropIndex('coach_id', 'trainings_coach_id_index')
      table.dropIndex(['gym_id', 'user_id'], 'trainings_gym_user_index')
    })

    // Exercises
    this.schema.alterTable('exercises', (table) => {
      table.dropIndex('type', 'exercises_type_index')
      table.dropIndex('priority', 'exercises_priority_index')
    })

    // Training_Exercise
    this.schema.alterTable('trainingexercise', (table) => {
      table.dropIndex('training_id', 'trainingexercise_training_id_index')
      table.dropIndex('exercise_id', 'trainingexercise_exercise_id_index')
    })

    // Products
    this.schema.alterTable('products', (table) => {
      table.dropIndex('gym_id', 'products_gym_id_index')
      table.dropIndex('category', 'products_category_index')
      table.dropIndex('published', 'products_published_index')
      table.dropIndex(['gym_id', 'code'], 'products_gym_code_unique')
    })

    // Gyms
    this.schema.alterTable('gyms', (table) => {
      table.dropIndex('published', 'gyms_published_index')
      table.dropIndex('created_at', 'gyms_created_at_index')
    })

    // Gym Permissions
    this.schema.alterTable('gympermissions', (table) => {
      table.dropIndex('gym_id', 'gympermissions_gym_id_index')
      table.dropIndex('personal_id', 'gympermissions_personal_id_index')
      table.dropIndex('is_active', 'gympermissions_is_active_index')
    })

    // User Permissions
    this.schema.alterTable('userpermissions', (table) => {
      table.dropIndex('user_id', 'userpermissions_user_id_index')
      table.dropIndex('grantee_type', 'userpermissions_grantee_type_index')
      table.dropIndex('grantee_id', 'userpermissions_grantee_id_index')
      table.dropIndex('is_active', 'userpermissions_is_active_index')
      table.dropIndex(['grantee_id', 'grantee_type'], 'userpermissions_grantee_index')
      table.dropIndex(['user_id', 'grantee_id'], 'userpermissions_user_grantee_index')
    })

    // Access Tokens
    this.schema.alterTable('auth_access_tokens', (table) => {
      table.dropIndex('tokenable_id', 'access_tokens_tokenable_id_index')
      table.dropIndex('expires_at', 'access_tokens_expires_at_index')
      table.dropIndex(['tokenable_id', 'expires_at'], 'access_tokens_tokenable_expires_index')
    })

    // Rate Limits
    this.schema.alterTable('rate_limits', (table) => {
      table.dropIndex('expire', 'rate_limits_expire_index')
    })
  }
}
