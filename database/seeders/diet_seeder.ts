import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Diet from '#models/diet'
import Meal from '#models/meal'
import Food from '#models/food'
import User from '#models/user'
import Gym from '#models/gym'

export default class extends BaseSeeder {
  static environment = ['development', 'testing']

  async run() {
    try {
      // Verificar se dietas já existem
      const existingDiets = await Diet.query().first()
      if (existingDiets) {
        console.log('⚠️  Diets already exist, skipping diet seeder')
        return
      }

      // Buscar academias e usuários
      const powerfit = await Gym.findByOrFail('name', 'PowerFit Academia')
      const strongGym = await Gym.findByOrFail('name', 'Strong Gym')
      const anaPersonal = await User.findByOrFail('email', 'ana.personal@powerfit.com.br')
      const marianaPersonal = await User.findByOrFail('email', 'mariana.personal@stronggym.com.br')

      console.log(`✓ Found PowerFit (${powerfit.id}), Strong Gym (${strongGym.id})`)
      console.log(
        `✓ Found Ana Personal (${anaPersonal.id}), Mariana Personal (${marianaPersonal.id})`
      )

      // Dieta 1: Hipertrofia para João Santos (PowerFit)
      const diet1 = await Diet.create({
        name: 'Dieta de Hipertrofia',
        description: 'Dieta focada em ganho de massa muscular',
        calories: 3000,
        proteins: 180,
        carbohydrates: 350,
        fats: 80,
        gym_id: powerfit.id,
        creator_id: anaPersonal.id,
      })

      const meal1 = await Meal.create({
        name: 'Café da Manhã',
        description: 'Refeição matinal rica em proteínas',
        hourly: '07:00',
        diet_id: diet1.id,
      })

      await Food.createMany([
        { name: 'Ovos mexidos (4 unidades)', meal_id: meal1.id },
        { name: 'Pão integral (2 fatias)', meal_id: meal1.id },
        { name: 'Abacate (1/2 unidade)', meal_id: meal1.id },
        { name: 'Café com leite', meal_id: meal1.id },
      ])

      const meal1Lunch = await Meal.create({
        name: 'Almoço',
        description: 'Refeição principal do dia',
        hourly: '12:00',
        diet_id: diet1.id,
      })

      await Food.createMany([
        { name: 'Arroz integral (150g)', meal_id: meal1Lunch.id },
        { name: 'Frango grelhado (200g)', meal_id: meal1Lunch.id },
        { name: 'Brócolis (100g)', meal_id: meal1Lunch.id },
        { name: 'Salada verde', meal_id: meal1Lunch.id },
      ])

      // Dieta 2: Emagrecimento para Maria Oliveira (PowerFit)
      const diet2 = await Diet.create({
        name: 'Dieta de Emagrecimento',
        description: 'Dieta com déficit calórico controlado',
        calories: 1800,
        proteins: 120,
        carbohydrates: 180,
        fats: 60,
        gym_id: powerfit.id,
        creator_id: anaPersonal.id,
      })

      const meal2 = await Meal.create({
        name: 'Café da Manhã',
        description: 'Café leve e nutritivo',
        hourly: '07:30',
        diet_id: diet2.id,
      })

      await Food.createMany([
        { name: 'Iogurte natural (200ml)', meal_id: meal2.id },
        { name: 'Granola (30g)', meal_id: meal2.id },
        { name: 'Frutas vermelhas (100g)', meal_id: meal2.id },
      ])

      const meal2Lunch = await Meal.create({
        name: 'Almoço',
        description: 'Almoço balanceado',
        hourly: '12:00',
        diet_id: diet2.id,
      })

      await Food.createMany([
        { name: 'Quinoa (100g)', meal_id: meal2Lunch.id },
        { name: 'Filé de frango (150g)', meal_id: meal2Lunch.id },
        { name: 'Legumes grelhados (150g)', meal_id: meal2_lunch.id },
      ])

      // Dieta 3: Manutenção para Pedro Fernandes (Strong Gym)
      const diet3 = await Diet.create({
        name: 'Dieta de Manutenção',
        description: 'Dieta equilibrada para manutenção de peso',
        calories: 2500,
        proteins: 150,
        carbohydrates: 280,
        fats: 70,
        gym_id: strongGym.id,
        creator_id: marianaPersonal.id,
      })

      const meal3 = await Meal.create({
        name: 'Café da Manhã',
        description: 'Café completo',
        hourly: '08:00',
        diet_id: diet3.id,
      })

      await Food.createMany([
        { name: 'Tapioca com queijo (1 unidade)', meal_id: meal3.id },
        { name: 'Suco de laranja natural', meal_id: meal3.id },
        { name: 'Mamão (1 fatia)', meal_id: meal3.id },
      ])

      console.log(`✅ Created 3 diets with meals and foods`)
    } catch (error) {
      console.error(
        '❌ Error in diet seeder:',
        error instanceof Error ? error.message : String(error)
      )
      throw error
    }
  }
}
