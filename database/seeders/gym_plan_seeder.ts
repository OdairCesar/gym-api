import { BaseSeeder } from '@adonisjs/lucid/seeders'
import GymPlan from '#models/gym_plan'

export default class extends BaseSeeder {
  static environment = ['development', 'testing', 'production']

  async run() {
    const plans = [
      {
        slug: 'initial',
        name: 'Inicial',
        price: 0,
        maxUsers: 25,
        features: null,
        isActive: true,
      },
      {
        slug: 'intermediate',
        name: 'Intermediário',
        price: 50,
        maxUsers: 100,
        features: null,
        isActive: true,
      },
      {
        slug: 'unlimited',
        name: 'Ilimitado',
        price: 100,
        maxUsers: null,
        features: null,
        isActive: true,
      },
    ]

    // Upsert por slug (idempotente)
    for (const plan of plans) {
      await GymPlan.updateOrCreate({ slug: plan.slug }, plan)
    }

    console.log('✅ Gym plans seeded successfully')
  }
}
