import vine from '@vinejs/vine'

/**
 * Validator for creating meal
 */
export const createMealValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(255),
    description: vine.string().trim().maxLength(1000).optional().nullable(),
    hourly: vine.string().trim().maxLength(10).optional().nullable(), // Ex: "08:00", "12:30"
  })
)

/**
 * Validator for updating meal
 */
export const updateMealValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(255).optional(),
    description: vine.string().trim().maxLength(1000).optional().nullable(),
    hourly: vine.string().trim().maxLength(10).optional().nullable(),
  })
)
