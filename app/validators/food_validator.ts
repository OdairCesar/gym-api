import vine from '@vinejs/vine'

/**
 * Validator for creating food
 */
export const createFoodValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255),
  })
)

/**
 * Validator for updating food
 */
export const updateFoodValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255).optional(),
  })
)
