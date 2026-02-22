import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Gym from '#models/gym.model'
import User from '#models/user.model'
import Diet from '#models/diet.model'
import Meal from '#models/meal.model'
import Food from '#models/food.model'
import hash from '@adonisjs/core/services/hash'

test.group('Diets - Create', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('personal should create diet', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    const personal = await User.create({
      name: 'Personal Trainer',
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

    const response = await client.post('/diets').bearerToken(token).json({
      name: 'Dieta de Hipertrofia',
      description: 'Dieta focada em ganho de massa',
      calories: 3000,
      proteins: 180,
      carbohydrates: 350,
      fats: 80,
    })

    response.assertStatus(201)
    response.assertBodyContains({
      name: 'Dieta de Hipertrofia',
      gym_id: gym.id,
      creator_id: personal.id,
    })

    const diet = await Diet.findBy('name', 'Dieta de Hipertrofia')
    assert.exists(diet)
  })

  test('client should not create diet', async ({ client }) => {
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

    const response = await client.post('/diets').bearerToken(token).json({
      name: 'Dieta Teste',
      description: 'Test',
    })

    response.assertStatus(403)
  })
})

test.group('Diets - List', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('personal should see diets they created', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    const personal = await User.create({
      name: 'Personal',
      email: 'personal@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      role: 'personal',
    })

    // Criar dieta
    await Diet.create({
      name: 'Diet 1',
      description: 'Test diet',
      gym_id: gym.id,
      creator_id: personal.id,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'personal@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.get('/diets').bearerToken(token)

    response.assertStatus(200)
    assert.isAtLeast(response.body().data.data.length, 1)
  })

  test('client with diet should see their diet', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    const personal = await User.create({
      name: 'Personal',
      email: 'personal@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      role: 'personal',
    })

    const diet = await Diet.create({
      name: 'Client Diet',
      description: 'Diet for client',
      gym_id: gym.id,
      creator_id: personal.id,
    })

    const client1 = await User.create({
      name: 'Client',
      email: 'client@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      diet_id: diet.id,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'client@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.get('/diets').bearerToken(token)

    response.assertStatus(200)
    assert.lengthOf(response.body().data.data, 1)
    assert.equal(response.body().data.data[0].id, diet.id)
  })
})

test.group('Meals - CRUD', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('personal should create meal in diet', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    const personal = await User.create({
      name: 'Personal',
      email: 'personal@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      role: 'personal',
    })

    const diet = await Diet.create({
      name: 'Test Diet',
      description: 'Test',
      gym_id: gym.id,
      creator_id: personal.id,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'personal@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.post(`/diets/${diet.id}/meals`).bearerToken(token).json({
      name: 'Café da Manhã',
      description: 'Primeira refeição do dia',
      hourly: '08:00',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      name: 'Café da Manhã',
      diet_id: diet.id,
    })

    const meal = await Meal.findBy('name', 'Café da Manhã')
    assert.exists(meal)
  })

  test('should list meals from diet', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    const personal = await User.create({
      name: 'Personal',
      email: 'personal@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      role: 'personal',
    })

    const diet = await Diet.create({
      name: 'Test Diet',
      gym_id: gym.id,
      creator_id: personal.id,
    })

    await Meal.create({
      name: 'Meal 1',
      diet_id: diet.id,
    })

    await Meal.create({
      name: 'Meal 2',
      diet_id: diet.id,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'personal@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.get(`/diets/${diet.id}/meals`).bearerToken(token)

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 2)
  })
})

test.group('Foods - CRUD', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('personal should create food in meal', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    const personal = await User.create({
      name: 'Personal',
      email: 'personal@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      role: 'personal',
    })

    const diet = await Diet.create({
      name: 'Test Diet',
      gym_id: gym.id,
      creator_id: personal.id,
    })

    const meal = await Meal.create({
      name: 'Café da Manhã',
      diet_id: diet.id,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'personal@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.post(`/meals/${meal.id}/foods`).bearerToken(token).json({
      name: 'Ovos mexidos (2 unidades)',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      name: 'Ovos mexidos (2 unidades)',
      meal_id: meal.id,
    })

    const food = await Food.findBy('name', 'Ovos mexidos (2 unidades)')
    assert.exists(food)
  })

  test('should list foods from meal', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    const personal = await User.create({
      name: 'Personal',
      email: 'personal@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      role: 'personal',
    })

    const diet = await Diet.create({
      name: 'Test Diet',
      gym_id: gym.id,
      creator_id: personal.id,
    })

    const meal = await Meal.create({
      name: 'Almoço',
      diet_id: diet.id,
    })

    await Food.create({ name: 'Arroz integral', meal_id: meal.id })
    await Food.create({ name: 'Frango grelhado', meal_id: meal.id })
    await Food.create({ name: 'Brócolis', meal_id: meal.id })

    const loginResponse = await client.post('/auth/login').json({
      email: 'personal@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.get(`/meals/${meal.id}/foods`).bearerToken(token)

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 3)
  })
})

test.group('Diets - Multi-tenant Isolation', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('personal should not see diets from other gyms', async ({ client, assert }) => {
    const gym1 = await Gym.create({ name: 'Gym 1', published: true })
    const gym2 = await Gym.create({ name: 'Gym 2', published: true })

    const personal1 = await User.create({
      name: 'Personal 1',
      email: 'personal1@example.com',
      password: await hash.make('senha123'),
      gym_id: gym1.id,
      role: 'personal',
    })

    const personal2 = await User.create({
      name: 'Personal 2',
      email: 'personal2@example.com',
      password: await hash.make('senha123'),
      gym_id: gym2.id,
      role: 'personal',
    })

    // Criar dieta na gym2
    await Diet.create({
      name: 'Diet from Gym 2',
      gym_id: gym2.id,
      creator_id: personal2.id,
    })

    // Login como personal1
    const loginResponse = await client.post('/auth/login').json({
      email: 'personal1@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.get('/diets').bearerToken(token)

    response.assertStatus(200)
    // Personal1 não deve ver dietas não-reusable da gym2
    const dietFromGym2 = response
      .body()
      .data.data.find((d: any) => d.gym_id === gym2.id && d._access === 'full')
    assert.isUndefined(dietFromGym2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SPRINT: Acesso Ampliado — full vs limited payload
// ─────────────────────────────────────────────────────────────────────────────

test.group('Diets - Full vs Limited Access', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('personal gets _access:full on own diet', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    const personal = await User.create({
      name: 'Personal',
      email: 'personal@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      role: 'personal',
    })

    const diet = await Diet.create({
      name: 'Dieta Hipertrofia',
      calories: 3000,
      gym_id: gym.id,
      creator_id: personal.id,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'personal@example.com',
      password: 'senha123',
    })
    const token = loginResponse.body().token.token

    const response = await client.get(`/diets/${diet.id}`).bearerToken(token)

    response.assertStatus(200)
    assert.equal(response.body().data._access, 'full')
    assert.exists(response.body().data.proteins)
  })

  test('client gets _access:limited on cross-gym reusable diet', async ({ client, assert }) => {
    const gym1 = await Gym.create({ name: 'Gym 1', published: true })
    const gym2 = await Gym.create({ name: 'Gym 2', published: true })

    const personal2 = await User.create({
      name: 'Personal 2',
      email: 'personal2@example.com',
      password: await hash.make('senha123'),
      gym_id: gym2.id,
      role: 'personal',
    })

    const reusableDiet = await Diet.create({
      name: 'Dieta Reusável',
      calories: 2500,
      gym_id: gym2.id,
      creator_id: personal2.id,
      is_reusable: true,
    })

    const clientUser = await User.create({
      name: 'Client',
      email: 'client@example.com',
      password: await hash.make('senha123'),
      gym_id: gym1.id,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'client@example.com',
      password: 'senha123',
    })
    const token = loginResponse.body().token.token

    const response = await client.get(`/diets/${reusableDiet.id}`).bearerToken(token)

    response.assertStatus(200)
    assert.equal(response.body().data._access, 'limited')
    // Campos sensíveis não devem aparecer no payload limited
    assert.notExists(response.body().data.proteins)
    assert.notExists(response.body().data.description)
    // Campos básicos devem aparecer
    assert.exists(response.body().data.id)
    assert.exists(response.body().data.name)
    assert.exists(response.body().data.calories)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SPRINT: Endpoint /diets/shared
// ─────────────────────────────────────────────────────────────────────────────

test.group('Diets - Shared (Reusable)', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('admin can list reusable diets from any gym', async ({ client, assert }) => {
    const gym1 = await Gym.create({ name: 'Gym 1', published: true })
    const gym2 = await Gym.create({ name: 'Gym 2', published: true })

    const personal2 = await User.create({
      name: 'Personal 2',
      email: 'personal2@example.com',
      password: await hash.make('senha123'),
      gym_id: gym2.id,
      role: 'personal',
    })

    const admin1 = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: await hash.make('senha123'),
      gym_id: gym1.id,
      role: 'admin',
    })

    await Diet.create({
      name: 'Dieta Reusável Cross',
      calories: 2000,
      gym_id: gym2.id,
      creator_id: personal2.id,
      is_reusable: true,
    })
    await Diet.create({
      name: 'Dieta Privada',
      calories: 2000,
      gym_id: gym2.id,
      creator_id: personal2.id,
      is_reusable: false,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'admin@example.com',
      password: 'senha123',
    })
    const token = loginResponse.body().token.token

    const response = await client.get('/diets/shared').bearerToken(token)

    response.assertStatus(200)
    const diets: any[] = response.body().data.data
    assert.isTrue(diets.every((d: any) => d.is_reusable === true))
    const names = diets.map((d: any) => d.name)
    assert.include(names, 'Dieta Reusável Cross')
    assert.notInclude(names, 'Dieta Privada')
  })

  test('client can list shared diets with limited payload', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })
    const personal = await User.create({
      name: 'Personal',
      email: 'personal@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      role: 'personal',
    })
    const clientUser = await User.create({
      name: 'Client',
      email: 'client@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
    })

    await Diet.create({
      name: 'Dieta Modelo',
      calories: 2200,
      gym_id: gym.id,
      creator_id: personal.id,
      is_reusable: true,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'client@example.com',
      password: 'senha123',
    })
    const token = loginResponse.body().token.token

    const response = await client.get('/diets/shared').bearerToken(token)

    response.assertStatus(200)
    const diets: any[] = response.body().data.data
    assert.isAtLeast(diets.length, 1)
    // Clientes recebem _access:limited
    const fromOtherGym = diets.find((d: any) => d.name === 'Dieta Modelo')
    assert.exists(fromOtherGym)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SPRINT: POST /diets/:id/clone
// ─────────────────────────────────────────────────────────────────────────────

test.group('Diets - Clone', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('personal can clone a reusable diet into their gym', async ({ client, assert }) => {
    const gym1 = await Gym.create({ name: 'Gym 1', published: true })
    const gym2 = await Gym.create({ name: 'Gym 2', published: true })

    const personal2 = await User.create({
      name: 'Personal 2',
      email: 'personal2@example.com',
      password: await hash.make('senha123'),
      gym_id: gym2.id,
      role: 'personal',
    })

    const personal1 = await User.create({
      name: 'Personal 1',
      email: 'personal1@example.com',
      password: await hash.make('senha123'),
      gym_id: gym1.id,
      role: 'personal',
    })

    const original = await Diet.create({
      name: 'Dieta Base',
      description: 'Dieta modelo',
      calories: 2800,
      proteins: 150,
      carbohydrates: 300,
      fats: 70,
      gym_id: gym2.id,
      creator_id: personal2.id,
      is_reusable: true,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'personal1@example.com',
      password: 'senha123',
    })
    const token = loginResponse.body().token.token

    const response = await client.post(`/diets/${original.id}/clone`).bearerToken(token)

    response.assertStatus(201)
    assert.equal(response.body().data.gym_id, gym1.id)
    assert.equal(response.body().data.creator_id, personal1.id)
    assert.equal(response.body().data.is_reusable, false)
    assert.include(response.body().data.name, 'Dieta Base')

    // Deve existir no banco
    const cloned = await Diet.findBy('creator_id', personal1.id)
    assert.exists(cloned)
  })

  test('client cannot clone a diet', async ({ client }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })
    const personal = await User.create({
      name: 'Personal',
      email: 'personal@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      role: 'personal',
    })
    const diet = await Diet.create({
      name: 'Dieta Base',
      gym_id: gym.id,
      creator_id: personal.id,
      is_reusable: true,
    })
    const clientUser = await User.create({
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

    const response = await client.post(`/diets/${diet.id}/clone`).bearerToken(token)
    response.assertStatus(403)
  })
})
