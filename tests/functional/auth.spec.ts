import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Auth - Register', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
    // Executar seeders para ter dados consistentes
    await testUtils.db().seed()
  })

  test('should register a new user successfully', async ({ client, assert }) => {
    const response = await client.post('/auth/register').json({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'senha123',
      gymId: 1, // PowerFit Academia do seeder
    })

    response.assertStatus(201)
    response.assertBodyContains({
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        gym_id: 1,
        role: 'user',
      },
    })

    assert.properties(response.body(), ['user', 'token'])
  })

  test('should not register user with duplicate email', async ({ client }) => {
    const response = await client.post('/auth/register').json({
      name: 'Duplicate User',
      email: 'admin@powerfit.com.br', // Email que já existe no seeder
      password: 'senha123',
      gymId: 1,
    })

    response.assertStatus(422) // Validation error
  })

  test('should validate required fields', async ({ client }) => {
    const response = await client.post('/auth/register').json({})

    response.assertStatus(422)
    response.assertBodyContains({ errors: [] })
  })
})

test.group('Auth - Login', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
    await testUtils.db().seed()
  })

  test('should login with valid credentials', async ({ client, assert }) => {
    const response = await client.post('/auth/login').json({
      email: 'admin@powerfit.com.br', // Usuario do seeder
      password: 'senha123',
    })

    response.assertStatus(200)
    assert.properties(response.body(), ['user', 'token'])
    assert.equal(response.body().user.email, 'admin@powerfit.com.br')
  })

  test('should not login with invalid password', async ({ client }) => {
    const response = await client.post('/auth/login').json({
      email: 'admin@powerfit.com.br', // Usuario do seeder
      password: 'senhaerrada',
    })

    response.assertStatus(400)
  })

  test('should not login with non-existent email', async ({ client }) => {
    const response = await client.post('/auth/login').json({
      email: 'naoexiste@example.com',
      password: 'senha123',
    })

    response.assertStatus(400)
  })
})

test.group('Auth - Logout', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
    await testUtils.db().seed()
  })

  test('should logout successfully', async ({ client }) => {
    // Login para obter token
    const loginResponse = await client.post('/auth/login').json({
      email: 'admin@powerfit.com.br',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    // Logout
    const response = await client.post('/auth/logout').bearerToken(token)

    response.assertStatus(200)
  })

  test('should not logout without token', async ({ client }) => {
    const response = await client.post('/auth/logout')

    response.assertStatus(401)
  })
})

test.group('Auth - Me', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
    await testUtils.db().seed()
  })

  test('should get current user info', async ({ client, assert }) => {
    // Login
    const loginResponse = await client.post('/auth/login').json({
      email: 'admin@powerfit.com.br',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    // Get current user
    const response = await client.get('/auth/me').bearerToken(token)

    response.assertStatus(200)
    response.assertBodyContains({
      name: 'Carlos Silva',
      email: 'admin@powerfit.com.br',
    })

    assert.notExists(response.body().password) // Não deve retornar senha
  })

  test('should not get user info without token', async ({ client }) => {
    const response = await client.get('/auth/me')

    response.assertStatus(401)
  })
})
