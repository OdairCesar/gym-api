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

const AuthController = () => import('#controllers/auth_controller')
const UsersController = () => import('#controllers/users_controller')
const DietsController = () => import('#controllers/diets_controller')
const MealsController = () => import('#controllers/meals_controller')
const FoodsController = () => import('#controllers/foods_controller')
const TrainingsController = () => import('#controllers/trainings_controller')
const ExercisesController = () => import('#controllers/exercises_controller')
const GymsController = () => import('#controllers/gyms_controller')
const ProductsController = () => import('#controllers/products_controller')
const GymPermissionsController = () => import('#controllers/gym_permissions_controller')
const UserPermissionsController = () => import('#controllers/user_permissions_controller')
const GymPlansController = () => import('#controllers/gym_plans_controller')
const GymSubscriptionsController = () => import('#controllers/gym_subscriptions_controller')
const SwaggerController = () => import('#controllers/swagger_controller')

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
router
  .group(() => {
    router.get('/', [GymsController, 'index'])
    router.get('/:id', [GymsController, 'show'])
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
    router.get('/', [GymPermissionsController, 'index'])
    router.get('/my-permissions', [GymPermissionsController, 'myPermissions'])
    router.get('/:id', [GymPermissionsController, 'show'])
    router.post('/', [GymPermissionsController, 'store'])
    router.put('/:id', [GymPermissionsController, 'update'])
    router.patch('/:id', [GymPermissionsController, 'update'])
    router.delete('/:id', [GymPermissionsController, 'destroy'])
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
    router.get('/', [UserPermissionsController, 'index'])
    router.get('/granted-to-me', [UserPermissionsController, 'grantedToMe'])
    router.get('/:id', [UserPermissionsController, 'show'])
    router.post('/', [UserPermissionsController, 'store'])
    router.put('/:id', [UserPermissionsController, 'update'])
    router.patch('/:id', [UserPermissionsController, 'update'])
    router.delete('/:id', [UserPermissionsController, 'destroy'])
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
    router.get('/', [GymPlansController, 'index'])
    router.get('/:id', [GymPlansController, 'show'])
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
    router.get('/:gymId/subscription', [GymSubscriptionsController, 'show'])
    router.post('/:gymId/subscription', [GymSubscriptionsController, 'store'])
    router.delete('/:gymId/subscription', [GymSubscriptionsController, 'destroy'])
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
