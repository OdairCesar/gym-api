import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Gym from '#models/gym'

export default class extends BaseSeeder {
  static environment = ['development', 'testing']

  async run() {
    // Verificar se academias já existem antes de criar
    const existingGyms = await Gym.query().whereIn('cnpj', [
      '12345678000190',
      '98765432000165',
      '11122233000144',
    ])

    if (existingGyms.length > 0) {
      console.log('⚠️  Gyms already exist, skipping gym seeder')
      return
    }

    const powerfit = await Gym.create({
      name: 'PowerFit Academia',
      description: 'Academia completa com equipamentos de última geração',
      cnpj: '12345678000190',
      phone: '(11) 98765-4321',
      email: 'contato@powerfit.com.br',
      address: 'Rua das Flores, 123 - Centro',
      published: true,
    })

    const strongGym = await Gym.create({
      name: 'Strong Gym',
      description: 'Foco em musculação e treinamento de força',
      cnpj: '98765432000165',
      phone: '(11) 91234-5678',
      email: 'contato@stronggym.com.br',
      address: 'Av. da Força, 456 - Vila Atlética',
      published: true,
    })

    const fitnessPlus = await Gym.create({
      name: 'Fitness Plus',
      description: 'Academia moderna com foco em bem-estar e qualidade de vida',
      cnpj: '11122233000144',
      phone: '(11) 99876-5432',
      email: 'contato@fitnessplus.com.br',
      address: 'Rua do Bem-Estar, 789 - Jardim Fitness',
      published: true,
    })

    console.log(
      `✅ Created gyms: PowerFit (${powerfit.id}), Strong (${strongGym.id}), Fitness Plus (${fitnessPlus.id})`
    )
  }
}
