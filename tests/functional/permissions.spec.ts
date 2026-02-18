import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Gym from '#models/gym'
import User from '#models/user'
import GymPermission from '#models/gym_permission'
import UserPermission from '#models/user_permission'
import Diet from '#models/diet'
import Training from '#models/training'
import hash from '@adonisjs/core/services/hash'

test.group('Gym Permissions - CRUD', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('admin should grant permission to external personal', async ({ client, assert }) => {
    const gym1 = await Gym.create({ name: 'Gym 1', published: true })
    const gym2 = await Gym.create({ name: 'Gym 2', published: true })

    const admin1 = await User.create({
      name: 'Admin 1',
      email: 'admin1@example.com',
      password: await hash.make('senha123'),
      gym_id: gym1.id,
      role: 'admin',
    })

    const personal2 = await User.create({
      name: 'Personal 2',
      email: 'personal2@example.com',
      password: await hash.make('senha123'),
      gym_id: gym2.id,
      role: 'personal',
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'admin1@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.post('/gym-permissions').bearerToken(token).json({
      personalId: personal2.id,
      canEditDiets: true,
      canEditTrainings: true,
    })

    response.assertStatus(201)
    response.assertBodyContains({
      gym_id: gym1.id,
      personal_id: personal2.id,
      can_edit_diets: true,
      can_edit_trainings: true,
    })

    const permission = await GymPermission.query()
      .where('gym_id', gym1.id)
      .where('personal_id', personal2.id)
      .first()

    assert.exists(permission)
  })

  test('personal should see gyms where they have permissions', async ({ client, assert }) => {
    const gym1 = await Gym.create({ name: 'Gym 1', published: true })
    const gym2 = await Gym.create({ name: 'Gym 2', published: true })

    const personal1 = await User.create({
      name: 'Personal 1',
      email: 'personal1@example.com',
      password: await hash.make('senha123'),
      gym_id: gym1.id,
      role: 'personal',
    })

    // Gym2 concede permissão ao personal1
    await GymPermission.create({
      gym_id: gym2.id,
      personal_id: personal1.id,
      can_edit_diets: true,
      can_edit_trainings: false,
      is_active: true,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'personal1@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.get('/gym-permissions/my-permissions').bearerToken(token)

    response.assertStatus(200)
    assert.lengthOf(response.body(), 1)
    assert.equal(response.body()[0].gym_id, gym2.id)
  })
})

test.group('User Permissions - CRUD', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('client should grant permission to personal', async ({ client, assert }) => {
    const gym1 = await Gym.create({ name: 'Gym 1', published: true })
    const gym2 = await Gym.create({ name: 'Gym 2', published: true })

    const client1 = await User.create({
      name: 'Client 1',
      email: 'client1@example.com',
      password: await hash.make('senha123'),
      gym_id: gym1.id,
    })

    const personal2 = await User.create({
      name: 'Personal 2',
      email: 'personal2@example.com',
      password: await hash.make('senha123'),
      gym_id: gym2.id,
      role: 'personal',
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'client1@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.post('/user-permissions').bearerToken(token).json({
      granteeType: 'personal',
      granteeId: personal2.id,
      canEditDiet: true,
      canEditTraining: false,
    })

    response.assertStatus(201)
    response.assertBodyContains({
      user_id: client1.id,
      grantee_type: 'personal',
      grantee_id: personal2.id,
    })

    const permission = await UserPermission.query()
      .where('user_id', client1.id)
      .where('grantee_id', personal2.id)
      .first()

    assert.exists(permission)
  })

  test('client should grant permission to gym', async ({ client, assert }) => {
    const gym1 = await Gym.create({ name: 'Gym 1', published: true })
    const gym2 = await Gym.create({ name: 'Gym 2', published: true })

    const client1 = await User.create({
      name: 'Client 1',
      email: 'client1@example.com',
      password: await hash.make('senha123'),
      gym_id: gym1.id,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'client1@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    const response = await client.post('/user-permissions').bearerToken(token).json({
      granteeType: 'gym',
      granteeId: gym2.id,
      canEditDiet: false,
      canEditTraining: true,
    })

    response.assertStatus(201)
    response.assertBodyContains({
      grantee_type: 'gym',
      grantee_id: gym2.id,
    })

    const permission = await UserPermission.query()
      .where('user_id', client1.id)
      .where('grantee_type', 'gym')
      .first()

    assert.exists(permission)
  })
})

test.group('Permissions - Cross-Tenant Access', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('personal with gym permission should access diets from that gym', async ({
    client,
    assert,
  }) => {
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
    const diet = await Diet.create({
      name: 'Diet from Gym 2',
      description: 'Test',
      gym_id: gym2.id,
      creator_id: personal2.id,
    })

    // Gym2 concede permissão ao personal1
    await GymPermission.create({
      gym_id: gym2.id,
      personal_id: personal1.id,
      can_edit_diets: true,
      can_edit_trainings: false,
      is_active: true,
    })

    const loginResponse = await client.post('/auth/login').json({
      email: 'personal1@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    // Personal1 deve ver dietas da gym2
    const response = await client.get('/diets').bearerToken(token)

    response.assertStatus(200)
    const dietFromGym2 = response.body().data.data.find((d: any) => d.id === diet.id)
    assert.exists(dietFromGym2)
  })

  test('personal with user permission should access specific user resources', async ({
    client,
  }) => {
    const gym1 = await Gym.create({ name: 'Gym 1', published: true })
    const gym2 = await Gym.create({ name: 'Gym 2', published: true })

    const client1 = await User.create({
      name: 'Client 1',
      email: 'client1@example.com',
      password: await hash.make('senha123'),
      gym_id: gym1.id,
    })

    const personal2 = await User.create({
      name: 'Personal 2',
      email: 'personal2@example.com',
      password: await hash.make('senha123'),
      gym_id: gym2.id,
      role: 'personal',
    })

    // Criar dieta do client1
    const diet = await Diet.create({
      name: 'Client 1 Diet',
      description: 'Test',
      gym_id: gym1.id,
      creator_id: client1.id,
    })

    // Client1 concede permissão ao personal2
    await UserPermission.create({
      user_id: client1.id,
      grantee_type: 'personal',
      grantee_id: personal2.id,
      can_edit_diets: true,
      can_edit_trainings: false,
      is_active: true,
    })

    // Login como personal2
    const loginResponse = await client.post('/auth/login').json({
      email: 'personal2@example.com',
      password: 'senha123',
    })

    const token = loginResponse.body().token.token

    // Personal2 deve conseguir acessar a dieta do client1
    const response = await client.get(`/diets/${diet.id}`).bearerToken(token)

    response.assertStatus(200)
    response.assertBodyContains({
      id: diet.id,
      name: 'Client 1 Diet',
    })
  })
})
