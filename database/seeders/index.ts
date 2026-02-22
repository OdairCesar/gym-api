import { BaseSeeder } from '@adonisjs/lucid/seeders'
import app from '@adonisjs/core/services/app'

export default class extends BaseSeeder {
  private async seed(Seeder: { default: typeof BaseSeeder }) {
    /**
     * Do not run when not in a environment specified in Seeder
     */
    if (
      !Seeder.default.environment ||
      (!Seeder.default.environment.includes('development') && app.inDev) ||
      (!Seeder.default.environment.includes('testing') && app.inTest) ||
      (!Seeder.default.environment.includes('production') && app.inProduction)
    ) {
      return
    }

    await new Seeder.default(this.client).run()
  }

  async run() {
    console.log('🌱 Starting database seeding...')

    // Ordem de execução dos seeders (respeitando dependências)
    console.log('📍 Seeding gym plans...')
    await this.seed(await import('#database/seeders/gymplan.seeder'))
    console.log('✅ Gym plans seeded')

    console.log('📍 Seeding gyms...')
    await this.seed(await import('#database/seeders/gym.seeder'))
    console.log('✅ Gyms seeded')

    console.log('📍 Seeding users...')
    await this.seed(await import('#database/seeders/user.seeder'))
    console.log('✅ Users seeded')

    console.log('📍 Seeding exercises...')
    await this.seed(await import('#database/seeders/exercise.seeder'))
    console.log('✅ Exercises seeded')

    console.log('📍 Seeding diets...')
    await this.seed(await import('#database/seeders/diet.seeder'))
    console.log('✅ Diets seeded')

    console.log('📍 Seeding trainings...')
    await this.seed(await import('#database/seeders/training.seeder'))
    console.log('✅ Trainings seeded')

    console.log('📍 Seeding products...')
    await this.seed(await import('#database/seeders/product.seeder'))
    console.log('✅ Products seeded')

    console.log('📍 Seeding permissions...')
    await this.seed(await import('#database/seeders/permission.seeder'))
    console.log('✅ Permissions seeded')

    console.log('🎉 Database seeding completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`   - Gym Plans: 3`)
    console.log(`   - Gyms: 3`)
    console.log(`   - Users: 9 (3 admins, 2 personals, 4 clients)`)
    console.log(`   - Exercises: 12`)
    console.log(`   - Diets: 3 (with meals and foods)`)
    console.log(`   - Trainings: 4`)
    console.log(`   - Products: 11`)
    console.log(`   - Permissions: 6`)
  }
}
