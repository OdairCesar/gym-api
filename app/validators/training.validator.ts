import vine from '@vinejs/vine'

/**
 * Validator for creating training
 */
export const createTrainingValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(255),
    description: vine.string().trim().minLength(3).maxLength(1000),
    userId: vine
      .number()
      .positive()
      .exists(async (db, value) => {
        const user = await db.from('users').where('id', value).first()
        return !!user
      }),
  })
)

/**
 * Validator for updating training
 */
export const updateTrainingValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(255).optional(),
    description: vine.string().trim().minLength(3).maxLength(1000).optional(),
    userId: vine
      .number()
      .positive()
      .exists(async (db, value) => {
        const user = await db.from('users').where('id', value).first()
        return !!user
      })
      .optional(),
  })
)
