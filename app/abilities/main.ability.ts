/*
|--------------------------------------------------------------------------
| Bouncer abilities
|--------------------------------------------------------------------------
|
| Apenas abilities transversais são definidas aqui.
| Regras de autorização sobre recursos específicos ficam nas Policies.
|
*/

import User, { UserRole } from '#models/user.model'
import { Bouncer } from '@adonisjs/bouncer'

/**
 * Verifica se o usuário é super admin da plataforma
 */
export const isSuper = Bouncer.ability((user: User) => {
  return user.role === UserRole.SUPER
})

/**
 * Verifica se o usuário é admin de academia
 */
export const isAdmin = Bouncer.ability((user: User) => {
  return user.role === UserRole.ADMIN
})

/**
 * Verifica se o usuário é personal/coach
 */
export const isPersonal = Bouncer.ability((user: User) => {
  return user.role === UserRole.PERSONAL
})
