import vine from '@vinejs/vine'

/**
 * Validator for creating gym permission
 */
export const createGymPermissionValidator = vine.compile(
  vine.object({
    personalId: vine
      .number()
      .positive()
      .exists(async (db, value) => {
        const user = await db.from('users').where('id', value).where('is_personal', true).first()
        return !!user
      }),
    canEditDiets: vine.boolean().optional(),
    canEditTrainings: vine.boolean().optional(),
  })
)

/**
 * Validator for updating gym permission
 */
export const updateGymPermissionValidator = vine.compile(
  vine.object({
    canEditDiets: vine.boolean().optional(),
    canEditTrainings: vine.boolean().optional(),
    isActive: vine.boolean().optional(),
  })
)
