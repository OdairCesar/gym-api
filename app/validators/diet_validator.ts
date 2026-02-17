import vine from '@vinejs/vine'

/**
 * Validator for creating diet
 */
export const createDietValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(255),
    description: vine.string().trim().maxLength(1000).optional().nullable(),
    calories: vine.number().positive().optional().nullable(),
    proteins: vine.number().min(0).optional().nullable(),
    carbohydrates: vine.number().min(0).optional().nullable(),
    fats: vine.number().min(0).optional().nullable(),
  })
)

/**
 * Validator for updating diet
 */
export const updateDietValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(255).optional(),
    description: vine.string().trim().maxLength(1000).optional().nullable(),
    calories: vine.number().positive().optional().nullable(),
    proteins: vine.number().min(0).optional().nullable(),
    carbohydrates: vine.number().min(0).optional().nullable(),
    fats: vine.number().min(0).optional().nullable(),
  })
)
