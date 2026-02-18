import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Gym from '#models/gym'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  static environment = ['development', 'testing']

  async run() {
    // Verificar se usuários já existem
    const existingUsers = await User.query().whereIn('email', [
      'admin@powerfit.com.br',
      'ana.personal@powerfit.com.br',
      'joao@email.com',
    ])

    if (existingUsers.length > 0) {
      console.log('⚠️  Users already exist, skipping user seeder')
      return
    }

    // Buscar academias criadas anteriormente
    const powerfit = await Gym.findByOrFail('name', 'PowerFit Academia')
    const strongGym = await Gym.findByOrFail('name', 'Strong Gym')
    const fitnessPlus = await Gym.findByOrFail('name', 'Fitness Plus')

    // PowerFit Academia users
    const carlosAdmin = await User.create({
      name: 'Carlos Silva',
      email: 'admin@powerfit.com.br',
      password: await hash.make('senha123'),
      birth_date: DateTime.fromISO('1985-05-15'),
      phone: '(11) 98765-1111',
      cpf: '12345678900',
      gender: 'M',
      profession: 'Administrador',
      address: 'Rua Admin, 100',
      gym_id: powerfit.id,
      role: 'admin',
      published: true,
    })

    const anaPersonal = await User.create({
      name: 'Ana Costa',
      email: 'ana.personal@powerfit.com.br',
      password: await hash.make('senha123'),
      birth_date: DateTime.fromISO('1990-08-20'),
      phone: '(11) 98765-2222',
      cpf: '98765432100',
      gender: 'F',
      profession: 'Personal Trainer',
      address: 'Rua Personal, 200',
      gym_id: powerfit.id,
      role: 'personal',
      published: true,
    })

    const joao = await User.create({
      name: 'João Santos',
      email: 'joao@email.com',
      password: await hash.make('senha123'),
      birth_date: DateTime.fromISO('1995-03-10'),
      phone: '(11) 98765-3333',
      cpf: '11122233344',
      gender: 'M',
      profession: 'Engenheiro',
      address: 'Rua Cliente, 300',
      gym_id: powerfit.id,
      role: 'user',
      published: true,
    })

    const maria = await User.create({
      name: 'Maria Oliveira',
      email: 'maria@email.com',
      password: await hash.make('senha123'),
      birth_date: DateTime.fromISO('1992-11-25'),
      phone: '(11) 98765-4444',
      cpf: '22233344455',
      gender: 'F',
      profession: 'Médica',
      address: 'Rua Cliente, 400',
      gym_id: powerfit.id,
      role: 'user',
      published: true,
    })

    // Strong Gym users
    const robertoAdmin = await User.create({
      name: 'Roberto Lima',
      email: 'admin@stronggym.com.br',
      password: await hash.make('senha123'),
      birth_date: DateTime.fromISO('1988-02-18'),
      phone: '(11) 91234-1111',
      cpf: '33344455566',
      gender: 'M',
      profession: 'Administrador',
      address: 'Av. Strong, 500',
      gym_id: strongGym.id,
      role: 'admin',
      published: true,
    })

    const marianaPersonal = await User.create({
      name: 'Mariana Santos',
      email: 'mariana.personal@stronggym.com.br',
      password: await hash.make('senha123'),
      birth_date: DateTime.fromISO('1993-06-12'),
      phone: '(11) 91234-2222',
      cpf: '44455566677',
      gender: 'F',
      profession: 'Personal Trainer',
      address: 'Av. Strong, 600',
      gym_id: strongGym.id,
      role: 'personal',
      published: true,
    })

    const pedro = await User.create({
      name: 'Pedro Fernandes',
      email: 'pedro@email.com',
      password: await hash.make('senha123'),
      birth_date: DateTime.fromISO('1987-09-05'),
      phone: '(11) 91234-3333',
      cpf: '55566677788',
      gender: 'M',
      profession: 'Contador',
      address: 'Av. Strong, 700',
      gym_id: strongGym.id,
      role: 'user',
      published: true,
    })

    // Fitness Plus users
    const julianaAdmin = await User.create({
      name: 'Juliana Rocha',
      email: 'admin@fitnessplus.com.br',
      password: await hash.make('senha123'),
      birth_date: DateTime.fromISO('1986-12-03'),
      phone: '(11) 99876-1111',
      cpf: '66677788899',
      gender: 'F',
      profession: 'Administradora',
      address: 'Rua Fitness, 800',
      gym_id: fitnessPlus.id,
      role: 'admin',
      published: true,
    })

    const lucas = await User.create({
      name: 'Lucas Costa',
      email: 'lucas@email.com',
      password: await hash.make('senha123'),
      birth_date: DateTime.fromISO('1994-04-20'),
      phone: '(11) 99876-2222',
      cpf: '77788899900',
      gender: 'M',
      profession: 'Designer',
      address: 'Rua Fitness, 900',
      gym_id: fitnessPlus.id,
      role: 'user',
      published: true,
    })

    console.log(`✅ Created users for all gyms`)
  }
}
