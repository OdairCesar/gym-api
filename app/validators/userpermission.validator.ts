import vine from '@vinejs/vine'

/**
 * Validator for creating user permission
 */
export const createUserpermissionValidator = vine.compile(
  vine.object({
    granteeType: vine.enum(['gym', 'personal']),
    granteeId: vine.number().positive(),
    canEditDiets: vine.boolean().optional(),
    canEditTrainings: vine.boolean().optional(),
  })
)

/**
 * Validator for updating user permission
 */
export const updateUserpermissionValidator = vine.compile(
  vine.object({
    canEditDiets: vine.boolean().optional(),
    canEditTrainings: vine.boolean().optional(),
    isActive: vine.boolean().optional(),
  })
)
