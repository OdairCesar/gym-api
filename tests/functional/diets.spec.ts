import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Gym from '#models/gym'
import User from '#models/user'
import Diet from '#models/diet'
import Meal from '#models/meal'
import Food from '#models/food'
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
      is_personal: true,
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
      is_personal: true,
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
    assert.isAtLeast(response.body().data.length, 1)
  })

  test('client with diet should see their diet', async ({ client, assert }) => {
    const gym = await Gym.create({ name: 'Test Gym', published: true })

    const personal = await User.create({
      name: 'Personal',
      email: 'personal@example.com',
      password: await hash.make('senha123'),
      gym_id: gym.id,
      is_personal: true,
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
    assert.lengthOf(response.body().data, 1)
    assert.equal(response.body().data[0].id, diet.id)
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
      is_personal: true,
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
      is_personal: true,
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
      is_personal: true,
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
      is_personal: true,
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
      is_personal: true,
    })

    const personal2 = await User.create({
      name: 'Personal 2',
      email: 'personal2@example.com',
      password: await hash.make('senha123'),
      gym_id: gym2.id,
      is_personal: true,
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
    // Personal1 não deve ver dietas da gym2
    const dietFromGym2 = response.body().data.find((d: any) => d.gym_id === gym2.id)
    assert.isUndefined(dietFromGym2)
  })
})
