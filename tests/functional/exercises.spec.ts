import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Gym from '#models/gym'
import User from '#models/user'
import Exercise from '#models/exercise'
import hash from '@adonisjs/core/services/hash'

// ─────────────────────────────────────────────────────────────────────────────
// SPRINT: Exercises - Acesso Ampliado
// Exercícios são catálogo global — qualquer usuário autenticado pode ver.
// Admin/personal recebem _access:full; clientes recebem _access:limited.
// ─────────────────────────────────────────────────────────────────────────────

test.group('Exercises - Access Control', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('personal gets _access:full on exercises list', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    await User.create({
      name: 'Personal',
      email: 'personal@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      role: 'personal',
    })

    await Exercise.createMany([
      { name: 'Supino Reto', reps: '4x10', type: 'musculacao', priority: 1 },
      { name: 'Agachamento', reps: '4x12', type: 'musculacao', priority: 2 },
    ])

    const loginResponse = await client.post('/auth/login').json({
      email: 'personal@example.com',
      password: 'senha123',
    })
    const token = loginResponse.body().token.token

    const response = await client.get('/exercises').bearerToken(token)

    response.assertStatus(200)
    const exercises: any[] = response.body().data.data
    assert.isAtLeast(exercises.length, 2)
    assert.isTrue(exercises.every((e) => e._access === 'full'))
    // Personal recebe campos completos
    assert.exists(exercises[0].reps)
  })

  test('client gets _access:limited on exercises list', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    await User.create({
      name: 'Client',
      email: 'client@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
    })

    await Exercise.createMany([
      { name: 'Supino Reto', reps: '4x10', type: 'musculacao', priority: 1 },
      { name: 'Agachamento', reps: '4x12', type: 'musculacao', priority: 2 },
    ])

    const loginResponse = await client.post('/auth/login').json({
      email: 'client@example.com',
      password: 'senha123',
    })
    const token = loginResponse.body().token.token

    const response = await client.get('/exercises').bearerToken(token)

    // Antes bloqueava com 403 — agora retorna 200 com payload limited
    response.assertStatus(200)
    const exercises: any[] = response.body().data.data
    assert.isAtLeast(exercises.length, 2)
    assert.isTrue(exercises.every((e) => e._access === 'limited'))
    // Campos básicos devem estar presentes
    assert.exists(exercises[0].id)
    assert.exists(exercises[0].name)
    assert.exists(exercises[0].type)
    // Campos sensíveis NÃO devem aparecer no payload limited
    assert.notExists(exercises[0].reps)
    assert.notExists(exercises[0].rest_seconds)
    assert.notExists(exercises[0].video_link)
  })

  test('client gets _access:limited on single exercise', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    await User.create({
      name: 'Client',
      email: 'client@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
    })

    const exercise = await Exercise.create({
      name: 'Leg Press',
      reps: '4x15',
      type: 'musculacao',
      weight: 100,
      rest_seconds: 60,
      priority: 1,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'client@example.com',
      password: 'senha123',
    })
    const token = loginResponse.body().token.token

    const response = await client.get(`/exercises/${exercise.id}`).bearerToken(token)

    response.assertStatus(200)
    assert.equal(response.body().data._access, 'limited')
    assert.exists(response.body().data.name)
    assert.exists(response.body().data.type)
    assert.notExists(response.body().data.reps)
    assert.notExists(response.body().data.weight)
    assert.notExists(response.body().data.rest_seconds)
  })

  test('personal gets _access:full on single exercise', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    await User.create({
      name: 'Personal',
      email: 'personal@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      role: 'personal',
    })

    const exercise = await Exercise.create({
      name: 'Deadlift',
      reps: '3x5',
      type: 'musculacao',
      weight: 120,
      rest_seconds: 180,
      priority: 1,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'personal@example.com',
      password: 'senha123',
    })
    const token = loginResponse.body().token.token

    const response = await client.get(`/exercises/${exercise.id}`).bearerToken(token)

    response.assertStatus(200)
    assert.equal(response.body().data._access, 'full')
    assert.exists(response.body().data.reps)
    assert.exists(response.body().data.weight)
    assert.exists(response.body().data.rest_seconds)
  })

  test('unauthenticated user cannot access exercises', async ({ client }) => {
    const response = await client.get('/exercises')
    response.assertStatus(401)
  })
})

test.group('Exercises - CRUD (admin/personal only)', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('personal can create an exercise', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    await User.create({
      name: 'Personal',
      email: 'personal@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      role: 'personal',
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'personal@example.com',
      password: 'senha123',
    })
    const token = loginResponse.body().token.token

    const response = await client.post('/exercises').bearerToken(token).json({
      name: 'Remada Curvada',
      reps: '4x10',
      type: 'musculacao',
      weight: 50,
      restSeconds: 90,
      priority: 1,
    })

    response.assertStatus(201)
    assert.equal(response.body().data.name, 'Remada Curvada')
    assert.equal(response.body().data._access, 'full')
  })

  test('client cannot create an exercise', async ({ client }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    await User.create({
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

    const response = await client.post('/exercises').bearerToken(token).json({
      name: 'Exercício Inválido',
      reps: '3x10',
      type: 'musculacao',
      priority: 1,
    })

    response.assertStatus(403)
  })

  test('can search exercises by name', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    await User.create({
      name: 'Personal',
      email: 'personal@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      role: 'personal',
    })

    await Exercise.createMany([
      { name: 'Supino Reto', reps: '4x10', type: 'musculacao', priority: 1 },
      { name: 'Supino Inclinado', reps: '4x10', type: 'musculacao', priority: 2 },
      { name: 'Agachamento', reps: '4x12', type: 'musculacao', priority: 3 },
    ])

    const loginResponse = await client.post('/auth/login').json({
      email: 'personal@example.com',
      password: 'senha123',
    })
    const token = loginResponse.body().token.token

    const response = await client.get('/exercises?search=supino').bearerToken(token)

    response.assertStatus(200)
    const exercises: any[] = response.body().data.data
    assert.lengthOf(exercises, 2)
    assert.isTrue(exercises.every((e) => e.name.toLowerCase().includes('supino')))
  })
})
