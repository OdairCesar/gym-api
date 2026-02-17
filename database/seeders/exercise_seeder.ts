import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Exercise from '#models/exercise'

export default class extends BaseSeeder {
  static environment = ['development', 'testing']

  async run() {
    // Verificar se exercícios já existem
    const existingExercises = await Exercise.query().first()
    if (existingExercises) {
      console.log('⚠️  Exercises already exist, skipping exercise seeder')
      return
    }

    // Criar exercícios globais (reutilizáveis)
    const exercises = await Exercise.createMany([
      // Exercícios de musculação - Peito
      {
        name: 'Supino Reto',
        reps: '4x10',
        type: 'musculacao',
        weight: 60,
        rest_seconds: 90,
        video_link: null,
        priority: 1,
      },
      {
        name: 'Supino Inclinado',
        reps: '3x12',
        type: 'musculacao',
        weight: 50,
        rest_seconds: 90,
        video_link: null,
        priority: 2,
      },
      {
        name: 'Crucifixo',
        reps: '3x15',
        type: 'musculacao',
        weight: 15,
        rest_seconds: 60,
        video_link: null,
        priority: 3,
      },
      // Exercícios de musculação - Costas
      {
        name: 'Barra Fixa',
        reps: '4x8',
        type: 'musculacao',
        weight: 0,
        rest_seconds: 90,
        video_link: null,
        priority: 1,
      },
      {
        name: 'Remada Curvada',
        reps: '4x10',
        type: 'musculacao',
        weight: 40,
        rest_seconds: 90,
        video_link: null,
        priority: 2,
      },
      {
        name: 'Pulley Costas',
        reps: '3x12',
        type: 'musculacao',
        weight: 35,
        rest_seconds: 75,
        video_link: null,
        priority: 3,
      },
      // Exercícios de musculação - Pernas
      {
        name: 'Agachamento',
        reps: '4x12',
        type: 'musculacao',
        weight: 80,
        rest_seconds: 120,
        video_link: null,
        priority: 1,
      },
      {
        name: 'Leg Press',
        reps: '4x15',
        type: 'musculacao',
        weight: 120,
        rest_seconds: 90,
        video_link: null,
        priority: 2,
      },
      // Exercícios aeróbicos
      {
        name: 'Corrida na Esteira',
        reps: '30 min',
        type: 'aerobico',
        weight: 0,
        rest_seconds: 0,
        video_link: null,
        priority: 1,
      },
      {
        name: 'Bike Ergométrica',
        reps: '25 min',
        type: 'aerobico',
        weight: 0,
        rest_seconds: 0,
        video_link: null,
        priority: 2,
      },
      // Exercícios de flexibilidade
      {
        name: 'Alongamento Geral',
        reps: '15 min',
        type: 'flexibilidade',
        weight: 0,
        rest_seconds: 0,
        video_link: null,
        priority: 1,
      },
      {
        name: 'Yoga Flow',
        reps: '20 min',
        type: 'flexibilidade',
        weight: 0,
        rest_seconds: 0,
        video_link: null,
        priority: 2,
      },
    ])

    console.log(`✅ Created ${exercises.length} exercises`)
  }
}
