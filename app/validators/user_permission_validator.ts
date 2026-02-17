import vine from '@vinejs/vine'

/**
 * Validator for creating user permission
 */
export const createUserPermissionValidator = vine.compile(
  vine.object({
    granteeType: vine.enum(['gym', 'personal']),
    granteeId: vine.number().positive(),
    canEditDiet: vine.boolean().optional(),
    canEditTraining: vine.boolean().optional(),
  })
)

/**
 * Validator for updating user permission
 */
export const updateUserPermissionValidator = vine.compile(
  vine.object({
    canEditDiet: vine.boolean().optional(),
    canEditTraining: vine.boolean().optional(),
    isActive: vine.boolean().optional(),
  })
)
