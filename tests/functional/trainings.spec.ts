import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Gym from '#models/gym'
import User from '#models/user'
import Training from '#models/training'
import Exercise from '#models/exercise'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'

test.group('Trainings - Create', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('personal should create training for client', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    const personal = await User.create({
      name: 'Personal',
      email: 'personal@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      is_personal: true,
    })

    const client1 = await User.create({
      name: 'Client',
      email: 'client@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'personal@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.post('/trainings').bearerToken(token).json({
      name: 'Treino A - Peito',
      description: 'Treino focado em peito e tríceps',
      userId: client1.id,
    })

    response.assertStatus(201)
    response.assertBodyContains({
      name: 'Treino A - Peito',
      gym_id: gym.id,
      user_id: client1.id,
      coach_id: personal.id,
    })

    const training = await Training.findBy('name', 'Treino A - Peito')
    assert.exists(training)
  })

  test('client should not create training', async ({ client }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    const client1 = await User.create({
      name: 'Client',
      email: 'client@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'client@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.post('/trainings').bearerToken(token).json({
      name: 'Treino Test',
      description: 'Test',
      userId: client1.id,
    })

    response.assertStatus(403)
  })
})

test.group('Exercises - CRUD', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('personal should create exercise', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    const personal = await User.create({
      name: 'Personal',
      email: 'personal@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      is_personal: true,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'personal@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.post('/exercises').bearerToken(token).json({
      name: 'Supino Reto',
      reps: '4x10',
      type: 'musculacao',
      weight: 60,
      restSeconds: 90,
      priority: 1,
    })

    response.assertStatus(201)
    response.assertBodyContains({
      name: 'Supino Reto',
      type: 'musculacao',
    })

    const exercise = await Exercise.findBy('name', 'Supino Reto')
    assert.exists(exercise)
  })

  test('should list exercises', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    const personal = await User.create({
      name: 'Personal',
      email: 'personal@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      is_personal: true,
    })

    await Exercise.createMany([
      { name: 'Supino', reps: '4x10', type: 'musculacao', priority: 1 },
      { name: 'Agachamento', reps: '4x12', type: 'musculacao', priority: 2 },
    ])

    const loginResponse = await client.post('/auth/login').json({
      email: 'personal@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.get('/exercises').bearerToken(token)

    response.assertStatus(200)
    assert.isAtLeast(response.body().data.length, 2)
  })
})

test.group('Trainings - Add/Remove Exercises', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('personal should add exercise to training', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    const personal = await User.create({
      name: 'Personal',
      email: 'personal@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      is_personal: true,
    })

    const client1 = await User.create({
      name: 'Client',
      email: 'client@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
    })

    const training = await Training.create({
      name: 'Treino A',
      description: 'Test',
      gym_id: gym.id,
      user_id: client1.id,
      coach_id: personal.id,
    })

    const exercise = await Exercise.create({
      name: 'Supino Reto',
      reps: '4x10',
      type: 'musculacao',
      priority: 1,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'personal@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client
      .post(`/trainings/${training.id}/exercises`)
      .bearerToken(token)
      .json({
        exerciseId: exercise.id,
        reps: '4x12',
        weight: 60,
        restSeconds: 90,
        priority: 1,
      })

    response.assertStatus(200)

    // Verificar se foi adicionado na pivot
    const pivot = await db
      .from('training_exercise')
      .where('training_id', training.id)
      .where('exercise_id', exercise.id)
      .first()

    assert.exists(pivot)
    assert.equal(pivot.reps, '4x12')
  })
})

test.group('Trainings - Multi-tenant Isolation', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('personal should not see trainings from other gyms', async ({ client, assert }) => {
    const gym1 = await Gym.create({ name: 'Gym 1', published: true })
    const gym2 = await Gym.create({ name: 'Gym 2', published: true })

    const personal1 = await User.create({
      name: 'Personal 1',
      email: 'personal1@example.com',
      password: await hash.make('senha123'),
      gym_id: gym1.id,
      is_personal: true,
    })

    const personal2 = await User.create({
      name: 'Personal 2',
      email: 'personal2@example.com',
      password: await hash.make('senha123'),
      gym_id: gym2.id,
      is_personal: true,
    })

    const client2 = await User.create({
      name: 'Client 2',
      email: 'client2@example.com',
      password: await hash.make('senha123'),
      gym_id: gym2.id,
    })

    // Criar treino na gym2
    await Training.create({
      name: 'Training from Gym 2',
      description: 'Test',
      gym_id: gym2.id,
      user_id: client2.id,
      coach_id: personal2.id,
    })

    // Login como personal1
    const loginResponse = await client.post('/auth/login').json({
      email: 'personal1@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.get('/trainings').bearerToken(token)

    response.assertStatus(200)
    // Personal1 não deve ver treinos da gym2
    const trainingFromGym2 = response.body().data.find((t: any) => t.gym_id === gym2.id)
    assert.isUndefined(trainingFromGym2)
  })
})
