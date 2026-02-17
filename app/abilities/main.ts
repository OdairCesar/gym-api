/*
|--------------------------------------------------------------------------
| Bouncer abilities
|--------------------------------------------------------------------------
|
| You may export multiple abilities from this file and pre-register them
| when creating the Bouncer instance.
|
| Pre-registered policies and abilities can be referenced as a string by their
| name. Also they are must if want to perform authorization inside Edge
| templates.
|
*/

import User from '#models/user'
import { Bouncer } from '@adonisjs/bouncer'

/**
 * Verifica se o usuário é admin
 */
export const isAdmin = Bouncer.ability((user: User) => {
  return user.is_admin
})

/**
 * Verifica se o usuário é personal/coach
 */
export const isPersonal = Bouncer.ability((user: User) => {
  return user.is_personal
})

/**
 * Verifica se o usuário tem permissões de edição (personal ou admin)
 */
export const canEdit = Bouncer.ability((user: User) => {
  return user.is_admin || user.is_personal
})

/**
 * Verifica se pode editar outro usuário
 * - Admins podem editar qualquer um
 * - Personals podem editar apenas users comuns (não admins, não outros personals)
 * - Users comuns não podem editar ninguém
 */
export const editUser = Bouncer.ability((user: User, targetUser: User) => {
  // Admins podem editar qualquer um
  if (user.is_admin) {
    return true
  }

  // Personals podem editar apenas users comuns
  if (user.is_personal) {
    return !targetUser.is_admin && !targetUser.is_personal
  }

  // Users comuns não podem editar
  return false
})

/**
 * Verifica se pode deletar outro usuário
 * Mesmas regras do editUser
 */
export const deleteUser = Bouncer.ability((user: User, targetUser: User) => {
  // Admins podem deletar qualquer um
  if (user.is_admin) {
    return true
  }

  // Personals podem deletar apenas users comuns
  if (user.is_personal) {
    return !targetUser.is_admin && !targetUser.is_personal
  }

  // Users comuns não podem deletar
  return false
})

/**
 * Verifica se pode criar recursos (dietas, treinos, etc)
 * - Admins e Personals podem criar
 * - Users comuns não podem (somente leitura)
 */
export const canCreate = Bouncer.ability((user: User) => {
  return user.is_admin || user.is_personal
})

/**
 * Verifica se pode atualizar recursos
 * - Admins podem atualizar tudo
 * - Personals podem atualizar recursos que criaram
 * - Users comuns não podem atualizar
 */
export const canUpdate = Bouncer.ability((user: User, resourceCreatorId?: number | null) => {
  if (user.is_admin) {
    return true
  }

  if (user.is_personal) {
    // Se não há creator_id, permite (recurso próprio ou sem dono)
    if (!resourceCreatorId) {
      return true
    }
    // Só pode editar se foi ele quem criou
    return user.id === resourceCreatorId
  }

  return false
})

/**
 * Verifica se pode deletar recursos
 * Mesmas regras do canUpdate
 */
export const canDelete = Bouncer.ability((user: User, resourceCreatorId?: number | null) => {
  if (user.is_admin) {
    return true
  }

  if (user.is_personal) {
    if (!resourceCreatorId) {
      return true
    }
    return user.id === resourceCreatorId
  }

  return false
})
