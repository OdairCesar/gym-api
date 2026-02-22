import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Product from '#models/product.model'
import Gym from '#models/gym.model'

export default class extends BaseSeeder {
  static environment = ['development', 'testing']

  async run() {
    // Verificar se produtos já existem
    const existingProducts = await Product.query().first()
    if (existingProducts) {
      console.log('⚠️  Products already exist, skipping product seeder')
      return
    }

    // Buscar academias criadas anteriormente
    const powerfit = await Gym.findByOrFail('name', 'PowerFit Academia')
    const strongGym = await Gym.findByOrFail('name', 'Strong Gym')
    const fitnessPlus = await Gym.findByOrFail('name', 'Fitness Plus')

    console.log(
      `✓ Creating products for gyms: PowerFit (${powerfit.id}), Strong (${strongGym.id}), Fitness Plus (${fitnessPlus.id})`
    )

    // Produtos da PowerFit Academia
    await Product.createMany([
      {
        name: 'Whey Protein PowerFit 1kg',
        description: 'Suplemento proteico de alta qualidade',
        price: 89.9,
        category: 'suplemento',
        published: true,
        gym_id: powerfit.id,
      },
      {
        name: 'Creatina PowerFit 300g',
        description: 'Creatina monohidratada pura',
        price: 45.5,
        category: 'suplemento',
        published: true,
        gym_id: powerfit.id,
      },
      {
        name: 'Camiseta PowerFit Dry Fit',
        description: 'Camiseta de treino com tecnologia dry fit',
        price: 39.9,
        category: 'vestuario',
        published: true,
        gym_id: powerfit.id,
      },
      {
        name: 'Toalha PowerFit Premium',
        description: 'Toalha de microfibra absorvente',
        price: 25.0,
        category: 'acessorio',
        published: true,
        gym_id: powerfit.id,
      },
    ])

    // Produtos da Strong Gym
    await Product.createMany([
      {
        name: 'Pre-Workout Strong Energy',
        description: 'Suplemento pré-treino energético',
        price: 67.9,
        category: 'suplemento',
        published: true,
        gym_id: strongGym.id,
      },
      {
        name: 'Malteína Strong 1kg',
        description: 'Carboidrato para reposição energética',
        price: 38.9,
        category: 'suplemento',
        published: true,
        gym_id: strongGym.id,
      },
      {
        name: 'Regata Strong Gym',
        description: 'Regata masculina para treino',
        price: 29.9,
        category: 'vestuario',
        published: true,
        gym_id: strongGym.id,
      },
      {
        name: 'Luva de Treino Strong',
        description: 'Luva antiderrapante para musculação',
        price: 22.5,
        category: 'acessorio',
        published: true,
        gym_id: strongGym.id,
      },
    ])

    // Produtos da Fitness Plus
    await Product.createMany([
      {
        name: 'Colágeno Fitness Plus 300g',
        description: 'Colágeno hidrolisado para articulações',
        price: 55.9,
        category: 'suplemento',
        published: true,
        gym_id: fitnessPlus.id,
      },
      {
        name: 'Top Fitness Plus Feminino',
        description: 'Top esportivo feminino com bojo',
        price: 42.9,
        category: 'vestuario',
        published: true,
        gym_id: fitnessPlus.id,
      },
      {
        name: 'Faixa Elástica Fitness Plus',
        description: 'Kit com 3 faixas de resistência',
        price: 35.9,
        category: 'acessorio',
        published: true,
        gym_id: fitnessPlus.id,
      },
    ])

    console.log('✅ Created products for all gyms')
  }
}
