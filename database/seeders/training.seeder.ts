import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Training from '#models/training.model'
import Exercise from '#models/exercise.model'
import User from '#models/user.model'
import Gym from '#models/gym.model'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  static environment = ['development', 'testing']

  async run() {
    try {
      // Verificar se treinamentos já existem
      const existingTrainings = await Training.query().first()
      if (existingTrainings) {
        console.log('⚠️  Trainings already exist, skipping training seeder')
        return
      }

      // Buscar academias e usuários
      const powerfit = await Gym.findByOrFail('name', 'PowerFit Academia')
      const strongGym = await Gym.findByOrFail('name', 'Strong Gym')
      const anaPersonal = await User.findByOrFail('email', 'ana.personal@powerfit.com.br')
      const marianaPersonal = await User.findByOrFail('email', 'mariana.personal@stronggym.com.br')
      const joao = await User.findByOrFail('email', 'joao@email.com')
      const maria = await User.findByOrFail('email', 'maria@email.com')
      const pedro = await User.findByOrFail('email', 'pedro@email.com')

      console.log(
        `✓ Found users for training: João (${joao.id}), Maria (${maria.id}), Pedro (${pedro.id})`
      )
      console.log(`✓ Found trainers: Ana (${anaPersonal.id}), Mariana (${marianaPersonal.id})`)

      // Buscar exercícios criados anteriormente
      const supinoReto = await Exercise.findByOrFail('name', 'Supino Reto')
      const supinoInclinado = await Exercise.findByOrFail('name', 'Supino Inclinado')
      const crucifixo = await Exercise.findByOrFail('name', 'Crucifixo')
      const barraFixa = await Exercise.findByOrFail('name', 'Barra Fixa')
      const remadaCurvada = await Exercise.findByOrFail('name', 'Remada Curvada')
      const corrida = await Exercise.findByOrFail('name', 'Corrida na Esteira')
      const bike = await Exercise.findByOrFail('name', 'Bike Ergométrica')
      const agachamento = await Exercise.findByOrFail('name', 'Agachamento')
      const legPress = await Exercise.findByOrFail('name', 'Leg Press')

      // Treino 1: Treino A - Peito e Tríceps para João Santos (PowerFit)
      const training1 = await Training.create({
        name: 'Treino A - Peito e Tríceps',
        description: 'Treino focado em peito e tríceps para hipertrofia',
        gym_id: powerfit.id,
        user_id: joao.id,
        coach_id: anaPersonal.id,
      })

      // Vincular exercícios ao treino
      await db.table('trainingexercise').insert([
        { exercise_id: supinoReto.id, training_id: training1.id },
        { exercise_id: supinoInclinado.id, training_id: training1.id },
        { exercise_id: crucifixo.id, training_id: training1.id },
      ])

      // Treino 2: Treino B - Costas e Bíceps para João Santos (PowerFit)
      const training2 = await Training.create({
        name: 'Treino B - Costas e Bíceps',
        description: 'Treino focado em costas e bíceps',
        gym_id: powerfit.id,
        user_id: joao.id,
        coach_id: anaPersonal.id,
      })

      await db.table('trainingexercise').insert([
        { exercise_id: barraFixa.id, training_id: training2.id },
        { exercise_id: remadaCurvada.id, training_id: training2.id },
      ])

      // Treino 3: Treino Cardio para Maria Oliveira (PowerFit)
      const training3 = await Training.create({
        name: 'Treino Cardio - Emagrecimento',
        description: 'Treino aeróbico para queima de gordura',
        gym_id: powerfit.id,
        user_id: maria.id,
        coach_id: anaPersonal.id,
      })

      await db.table('trainingexercise').insert([
        { exercise_id: corrida.id, training_id: training3.id },
        { exercise_id: bike.id, training_id: training3.id },
      ])

      // Treino 4: Treino de Pernas para Pedro Fernandes (Strong Gym)
      const training4 = await Training.create({
        name: 'Treino C - Pernas Completo',
        description: 'Treino completo de pernas e glúteos',
        gym_id: strongGym.id,
        user_id: pedro.id,
        coach_id: marianaPersonal.id,
      })

      await db.table('trainingexercise').insert([
        { exercise_id: agachamento.id, training_id: training4.id },
        { exercise_id: legPress.id, training_id: training4.id },
      ])

      console.log(`✅ Created 4 training programs with exercise relationships`)
    } catch (error) {
      console.error(
        '❌ Error in training seeder:',
        error instanceof Error ? error.message : String(error)
      )
      throw error
    }
  }
}
