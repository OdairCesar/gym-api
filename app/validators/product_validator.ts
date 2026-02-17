import vine from '@vinejs/vine'

/**
 * Validator for creating product
 */
export const createProductValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255),
    description: vine.string().trim().minLength(3).maxLength(1000).optional(),
    price: vine.number().min(0),
    stock: vine.number().min(0),
    category: vine.string().trim().maxLength(100).optional(),
    code: vine.string().trim().maxLength(100).optional(),
    published: vine.boolean().optional(),
  })
)

/**
 * Validator for updating product
 */
export const updateProductValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255).optional(),
    description: vine.string().trim().minLength(3).maxLength(1000).optional(),
    price: vine.number().min(0).optional(),
    stock: vine.number().min(0).optional(),
    category: vine.string().trim().maxLength(100).optional(),
    code: vine.string().trim().maxLength(100).optional(),
    published: vine.boolean().optional(),
  })
)
