import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Gym from '#models/gym'
import User from '#models/user'
import Product from '#models/product'
import hash from '@adonisjs/core/services/hash'

test.group('Products - CRUD', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
    await testUtils.db().seed()
  })

  test('admin should create product', async ({ client, assert }) => {
    // Admin Carlos da PowerFit
    const loginResponse = await client.post('/auth/login').json({
      email: 'admin@powerfit.com.br',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.post('/products').bearerToken(token).json({
      name: 'Whey Protein 1kg',
      description: 'Suplemento proteico',
      price: 89.9,
      stock: 50,
      category: 'Suplementos',
      code: 'WHEY-001',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      name: 'Whey Protein 1kg',
      gym_id: 1, // PowerFit
    })

    const product = await Product.findBy('name', 'Whey Protein 1kg')
    assert.exists(product)
  })

  test('client should not create product', async ({ client }) => {
    // Cliente João da PowerFit
    const loginResponse = await client.post('/auth/login').json({
      email: 'joao@email.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.post('/products').bearerToken(token).json({
      name: 'Test Product',
      price: 10,
      stock: 5,
    })

    response.assertStatus(403)
  })

  test('should list products from gym', async ({ client, assert }) => {
    // Admin Carlos da PowerFit
    const loginResponse = await client.post('/auth/login').json({
      email: 'admin@powerfit.com.br',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.get('/products').bearerToken(token)

    response.assertStatus(200)
    // PowerFit tem 4 produtos no seeder
    assert.lengthOf(response.body().data, 4)
  })

  test('products should be isolated by gym', async ({ client, assert }) => {
    // Admin Carlos da PowerFit não deve ver produtos da Strong Gym
    const loginResponse = await client.post('/auth/login').json({
      email: 'admin@powerfit.com.br',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.get('/products').bearerToken(token)

    response.assertStatus(200)
    // Não deve ver produtos de outras academias (todos devem ser gym_id: 1)
    response.body().data.forEach((product: any) => {
      assert.equal(product.gym_id, 1)
    })
  })
})
