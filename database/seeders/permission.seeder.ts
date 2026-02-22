import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Gympermission from '#models/gympermission.model'
import Userpermission from '#models/userpermission.model'
import User from '#models/user.model'
import Gym from '#models/gym.model'

export default class extends BaseSeeder {
  static environment = ['development', 'testing']

  async run() {
    try {
      // Verificar se permissões já existem
      const existingPermissions = await Gympermission.query().first()
      if (existingPermissions) {
        console.log('⚠️  Permissions already exist, skipping permission seeder')
        return
      }

      // Buscar academias e usuários
      const powerfit = await Gym.findByOrFail('name', 'PowerFit Academia')
      const strongGym = await Gym.findByOrFail('name', 'Strong Gym')
      const fitnessPlus = await Gym.findByOrFail('name', 'Fitness Plus')
      const anaPersonal = await User.findByOrFail('email', 'ana.personal@powerfit.com.br')
      const marianaPersonal = await User.findByOrFail('email', 'mariana.personal@stronggym.com.br')
      const joao = await User.findByOrFail('email', 'joao@email.com')
      const maria = await User.findByOrFail('email', 'maria@email.com')
      const lucas = await User.findByOrFail('email', 'lucas@email.com')

      console.log(`✓ Setting up permissions for cross-gym collaborations`)

      // Gym Permissions: Permissões de academia para personals externos

      // PowerFit autoriza Mariana Santos (personal da Strong Gym)
      await Gympermission.create({
        gym_id: powerfit.id,
        personal_id: marianaPersonal.id,
        can_edit_diets: true,
        can_edit_trainings: true,
        is_active: true,
      })

      // Strong Gym autoriza Ana Costa (personal da PowerFit)
      await Gympermission.create({
        gym_id: strongGym.id,
        personal_id: anaPersonal.id,
        can_edit_diets: true,
        can_edit_trainings: false, // Apenas dietas
        is_active: true,
      })

      // Fitness Plus autoriza Ana Costa (personal da PowerFit) para consultoria
      await Gympermission.create({
        gym_id: fitnessPlus.id,
        personal_id: anaPersonal.id,
        can_edit_diets: true,
        can_edit_trainings: false,
        is_active: true,
      })

      // User Permissions: Permissões específicas de usuários

      // Lucas Costa (Fitness Plus) permite que Ana Costa (personal da PowerFit)
      // edite sua dieta e treino (cenário: Lucas treina temporariamente na PowerFit)
      await Userpermission.create({
        user_id: lucas.id,
        grantee_type: 'personal',
        grantee_id: anaPersonal.id,
        can_edit_diets: true,
        can_edit_trainings: true,
        is_active: true,
      })

      // João Santos (PowerFit) permite que a Strong Gym
      // edite seu treino (cenário: viajando e treinando temporariamente na Strong Gym)
      await Userpermission.create({
        user_id: joao.id,
        grantee_type: 'gym',
        grantee_id: strongGym.id,
        can_edit_diets: false,
        can_edit_trainings: true,
        is_active: true,
      })

      // Maria Oliveira (PowerFit) permite que Mariana Santos (Strong Gym)
      // edite apenas sua dieta (consultoria nutricional específica)
      await Userpermission.create({
        user_id: maria.id,
        grantee_type: 'personal',
        grantee_id: marianaPersonal.id,
        can_edit_diets: true,
        can_edit_trainings: false,
        is_active: true,
      })

      console.log(`✅ Created 6 cross-gym permissions (3 gym + 3 user)`)
    } catch (error) {
      console.error(
        '❌ Error in permission seeder:',
        error instanceof Error ? error.message : String(error)
      )
      throw error
    }
  }
}
