/*
|--------------------------------------------------------------------------
| Bouncer policies
|--------------------------------------------------------------------------
|
| You may define a collection of policies inside this file and pre-register
| them when creating a new bouncer instance.
|
| Pre-registered policies and abilities can be referenced as a string by their
| name. Also they are must if want to perform authorization inside Edge
| templates.
|
*/

export const policies = {
  UserPolicy: () => import('#policies/user_policy'),
  DietPolicy: () => import('#policies/diet_policy'),
  TrainingPolicy: () => import('#policies/training_policy'),
  ProductPolicy: () => import('#policies/product_policy'),
  GymPolicy: () => import('#policies/gym_policy'),
}
