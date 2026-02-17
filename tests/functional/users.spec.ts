import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Gym from '#models/gym'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

test.group('Users - List', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
    await testUtils.db().seed()
  })

  test('admin should see all users from their gym', async ({ client, assert }) => {
    // Login como admin da PowerFit
    const loginResponse = await client.post('/auth/login').json({
      email: 'admin@powerfit.com.br',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    // Listar usuários
    const response = await client.get('/users').bearerToken(token)

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 4) // Carlos, Ana, João, Maria (PowerFit)
  })

  test('client should only see themselves', async ({ client, assert }) => {
    // Login como cliente João
    const loginResponse = await client.post('/auth/login').json({
      email: 'joao@email.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    // Listar usuários
    const response = await client.get('/users').bearerToken(token)

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 1) // Only themselves
    assert.equal(response.body().data[0].email, 'joao@email.com')
  })
})

test.group('Users - Create', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
    await testUtils.db().seed()
  })

  test('admin should create new user in their gym', async ({ client }) => {
    const loginResponse = await client.post('/auth/login').json({
      email: 'admin@powerfit.com.br',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.post('/users').bearerToken(token).json({
      name: 'New User',
      email: 'newuser@example.com',
      password: 'senha123',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      name: 'New User',
      email: 'newuser@example.com',
      gym_id: 1, // PowerFit
    })
  })

  test('client should not create users', async ({ client }) => {
    const loginResponse = await client.post('/auth/login').json({
      email: 'joao@email.com', // Cliente do seeder
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.post('/users').bearerToken(token).json({
      name: 'New User',
      email: 'newuser@example.com',
      password: 'senha123',
    })

    response.assertStatus(403) // Forbidden
  })
})

test.group('Users - Update', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
    await testUtils.db().seed()
  })

  test('user should update their own profile', async ({ client, assert }) => {
    // Usar usuário João do seeder
    const loginResponse = await client.post('/auth/login').json({
      email: 'joao@email.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token
    const userId = loginResponse.body().user.id

    const response = await client.put(`/users/${userId}`).bearerToken(token).json({
      name: 'João Santos Updated',
      phone: '(11) 99999-9999',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      name: 'João Santos Updated',
      phone: '(11) 99999-9999',
    })

    // Verificar no banco
    const user = await User.find(userId)
    assert.equal(user!.name, 'João Santos Updated')
    assert.equal(user!.phone, '(11) 99999-9999')
  })

  test('admin should update other users', async ({ client }) => {
    // Admin Carlos atualiza usuário João
    const loginResponse = await client.post('/auth/login').json({
      email: 'admin@powerfit.com.br',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    // Buscar João do seeder
    const joao = await User.findByOrFail('email', 'joao@email.com')

    const response = await client.put(`/users/${joao.id}`).bearerToken(token).json({
      name: 'João Updated by Admin',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      name: 'João Updated by Admin',
    })
  })

  test('client should not update other users', async ({ client }) => {
    // João tenta atualizar Maria
    const loginResponse = await client.post('/auth/login').json({
      email: 'joao@email.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    // Buscar Maria do seeder
    const maria = await User.findByOrFail('email', 'maria@email.com')

    const response = await client.put(`/users/${maria.id}`).bearerToken(token).json({
      name: 'Hacked',
    })

    response.assertStatus(403)
  })
})

test.group('Users - Delete', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
    await testUtils.db().seed()
  })

  test('admin should delete users from their gym', async ({ client, assert }) => {
    // Admin Carlos deleta usuário Maria
    const loginResponse = await client.post('/auth/login').json({
      email: 'admin@powerfit.com.br',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    // Buscar Maria do seeder
    const maria = await User.findByOrFail('email', 'maria@email.com')

    const response = await client.delete(`/users/${maria.id}`).bearerToken(token)

    response.assertStatus(204)

    // Verificar se foi deletado
    const deletedUser = await User.find(maria.id)
    assert.isNull(deletedUser)
  })

  test('client should not delete users', async ({ client }) => {
    // João tenta deletar Maria
    const loginResponse = await client.post('/auth/login').json({
      email: 'joao@email.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    // Buscar Maria do seeder
    const maria = await User.findByOrFail('email', 'maria@email.com')

    const response = await client.delete(`/users/${maria.id}`).bearerToken(token)

    response.assertStatus(403)
  })
})

test.group('Users - Multi-tenant Isolation', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
    await testUtils.db().seed()
  })

  test('admin should not see users from other gyms', async ({ client, assert }) => {
    // Admin da PowerFit não deve ver usuários da Strong Gym
    const loginResponse = await client.post('/auth/login').json({
      email: 'admin@powerfit.com.br',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.get('/users').bearerToken(token)

    response.assertStatus(200)
    // Deve ver apenas usuários da PowerFit: Carlos, Ana, João, Maria
    assert.lengthOf(response.body().data, 4)
    // Verificar que todos são da PowerFit (gym_id: 1)
    response.body().data.forEach((user: any) => {
      assert.equal(user.gym_id, 1)
    })
  })
})
