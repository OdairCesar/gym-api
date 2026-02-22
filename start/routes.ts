/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { authThrottle, apiThrottle, publicThrottle } from '#start/limiter'

const AuthController = () => import('#controllers/auth.controller')
const DietsController = () => import('#controllers/diets.controller')
const ExercisesController = () => import('#controllers/exercises.controller')
const FoodsController = () => import('#controllers/foods.controller')
const GympermissionsController = () => import('#controllers/gympermissions.controller')
const GymsController = () => import('#controllers/gyms.controller')
const GymplansController = () => import('#controllers/gymplans.controller')
const UserpermissionsControllers = () => import('#controllers/gymsubscriptions.controller')
const MealsController = () => import('#controllers/meals.controller')
const ProductsController = () => import('#controllers/products.controller')
const SwaggerController = () => import('#controllers/swagger.controller')
const TrainingsController = () => import('#controllers/trainings.controller')
const UserpermissionsController = () => import('#controllers/userpermissions.controller')
const UsersController = () => import('#controllers/users.controller')

// Health check
router
  .get('/', async () => {
    return {
      app: 'Gym API',
      version: '1.0.0',
      status: 'ok',
    }
  })
  .use(publicThrottle)

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.post('/register', [AuthController, 'register']).use(authThrottle)
    router.post('/login', [AuthController, 'login']).use(authThrottle)
    router.post('/logout', [AuthController, 'logout']).use(middleware.auth())
    router.get('/me', [AuthController, 'me']).use(middleware.auth())
  })
  .prefix('/auth')

/*
|--------------------------------------------------------------------------
| Users Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('/pending-users', [UsersController, 'pendingUsers'])
    router.post('/:id/approve-user', [UsersController, 'approveUser'])
    router.post('/:id/reject-user', [UsersController, 'rejectUser'])
    router.get('/', [UsersController, 'index'])
    router.get('/:id', [UsersController, 'show'])
    router.post('/', [UsersController, 'create'])
    router.put('/:id', [UsersController, 'update'])
    router.patch('/:id', [UsersController, 'update'])
    router.delete('/:id', [UsersController, 'destroy'])
  })
  .prefix('/users')
  .use([middleware.auth(), apiThrottle])

/*
|--------------------------------------------------------------------------
| Diets Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('/', [DietsController, 'index'])
    // /shared antes de /:id para evitar conflito de rota
    router.get('/shared', [DietsController, 'shared'])
    router.get('/:id', [DietsController, 'show'])
    router.post('/', [DietsController, 'create'])
    router.post('/:id/clone', [DietsController, 'clone'])
    router.put('/:id', [DietsController, 'update'])
    router.patch('/:id', [DietsController, 'update'])
    router.delete('/:id', [DietsController, 'destroy'])
  })
  .prefix('/diets')
  .use([middleware.auth(), apiThrottle])

/*
|--------------------------------------------------------------------------
| Meals Routes (nested under diets)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('/', [MealsController, 'index'])
    router.get('/:id', [MealsController, 'show'])
    router.post('/', [MealsController, 'create'])
    router.put('/:id', [MealsController, 'update'])
    router.patch('/:id', [MealsController, 'update'])
    router.delete('/:id', [MealsController, 'destroy'])
  })
  .prefix('/diets/:dietId/meals')
  .use([middleware.auth(), apiThrottle])

/*
|--------------------------------------------------------------------------
| Foods Routes (nested under meals)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('/', [FoodsController, 'index'])
    router.get('/:id', [FoodsController, 'show'])
    router.post('/', [FoodsController, 'create'])
    router.put('/:id', [FoodsController, 'update'])
    router.patch('/:id', [FoodsController, 'update'])
    router.delete('/:id', [FoodsController, 'destroy'])
  })
  .prefix('/meals/:mealId/foods')
  .use([middleware.auth(), apiThrottle])

/*
|--------------------------------------------------------------------------
| Trainings Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('/', [TrainingsController, 'index'])
    // /shared antes de /:id para evitar conflito de rota
    router.get('/shared', [TrainingsController, 'shared'])
    router.get('/:id', [TrainingsController, 'show'])
    router.post('/', [TrainingsController, 'create'])
    router.post('/:id/clone', [TrainingsController, 'clone'])
    router.put('/:id', [TrainingsController, 'update'])
    router.patch('/:id', [TrainingsController, 'update'])
    router.delete('/:id', [TrainingsController, 'destroy'])

    // Exercise management within training
    router.post('/:id/exercises', [TrainingsController, 'addExercise'])
    router.delete('/:id/exercises/:exerciseId', [TrainingsController, 'removeExercise'])
  })
  .prefix('/trainings')
  .use([middleware.auth(), apiThrottle])

/*
|--------------------------------------------------------------------------
| Exercises Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('/', [ExercisesController, 'index'])
    router.get('/:id', [ExercisesController, 'show'])
    router.post('/', [ExercisesController, 'create'])
    router.put('/:id', [ExercisesController, 'update'])
    router.patch('/:id', [ExercisesController, 'update'])
    router.delete('/:id', [ExercisesController, 'destroy'])
  })
  .prefix('/exercises')
  .use([middleware.auth(), apiThrottle])

/*
|--------------------------------------------------------------------------
| Gyms Routes
|--------------------------------------------------------------------------
*/
// Public routes - accessible without token (returns limited data)
router
  .group(() => {
    router.get('/', [GymsController, 'index'])
    router.get('/:id', [GymsController, 'show'])
  })
  .prefix('/gyms')
  .use(publicThrottle)

// Protected routes - require authentication
router
  .group(() => {
    router.post('/', [GymsController, 'store'])
    router.put('/:id', [GymsController, 'update'])
    router.patch('/:id', [GymsController, 'update'])
    router.delete('/:id', [GymsController, 'destroy'])
    router.get('/:id/stats', [GymsController, 'stats'])
  })
  .prefix('/gyms')
  .use([middleware.auth(), apiThrottle])

/*
|--------------------------------------------------------------------------
| Products Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('/', [ProductsController, 'index'])
    router.get('/:id', [ProductsController, 'show'])
    router.post('/', [ProductsController, 'store'])
    router.put('/:id', [ProductsController, 'update'])
    router.patch('/:id', [ProductsController, 'update'])
    router.delete('/:id', [ProductsController, 'destroy'])
    router.patch('/:id/stock', [ProductsController, 'updateStock'])
  })
  .prefix('/products')
  .use([middleware.auth(), apiThrottle])

/*
|--------------------------------------------------------------------------
| Gym Permissions Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('/', [GympermissionsController, 'index'])
    router.get('/my-permissions', [GympermissionsController, 'myPermissions'])
    router.get('/:id', [GympermissionsController, 'show'])
    router.post('/', [GympermissionsController, 'store'])
    router.put('/:id', [GympermissionsController, 'update'])
    router.patch('/:id', [GympermissionsController, 'update'])
    router.delete('/:id', [GympermissionsController, 'destroy'])
  })
  .prefix('/gym-permissions')
  .use([middleware.auth(), apiThrottle])

/*
|--------------------------------------------------------------------------
| User Permissions Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('/', [UserpermissionsController, 'index'])
    router.get('/granted-to-me', [UserpermissionsController, 'grantedToMe'])
    router.get('/:id', [UserpermissionsController, 'show'])
    router.post('/', [UserpermissionsController, 'store'])
    router.put('/:id', [UserpermissionsController, 'update'])
    router.patch('/:id', [UserpermissionsController, 'update'])
    router.delete('/:id', [UserpermissionsController, 'destroy'])
  })
  .prefix('/user-permissions')
  .use([middleware.auth(), apiThrottle])

/*
|--------------------------------------------------------------------------
| Gym Plans Routes (Public)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('/', [GymplansController, 'index'])
    router.get('/:id', [GymplansController, 'show'])
  })
  .prefix('/gym-plans')
  .use(publicThrottle)

/*
|--------------------------------------------------------------------------
| Gym Subscriptions Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('/:gymId/subscription', [UserpermissionsControllers, 'show'])
    router.post('/:gymId/subscription', [UserpermissionsControllers, 'store'])
    router.delete('/:gymId/subscription', [UserpermissionsControllers, 'destroy'])
  })
  .prefix('/gyms')
  .use([middleware.auth(), apiThrottle])

/*
|--------------------------------------------------------------------------
| Swagger Documentation Routes
|--------------------------------------------------------------------------
*/
router.get('/swagger.json', [SwaggerController, 'json'])
router.get('/docs', [SwaggerController, 'ui'])
