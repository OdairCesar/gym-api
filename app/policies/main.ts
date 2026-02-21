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
  DietPolicy: () => import('#policies/diet.policy'),
  GymPolicy: () => import('#policies/gym.policy'),
  GympermissionPolicy: () => import('#policies/gympermission.policy'),
  ProductPolicy: () => import('#policies/product.policy'),
  SubscriptionPolicy: () => import('#policies/subscription.policy'),
  TrainingPolicy: () => import('#policies/training.policy'),
  UserPolicy: () => import('#policies/user.policy'),
  UserpermissionPolicy: () => import('#policies/userpermission.policy'),
}
