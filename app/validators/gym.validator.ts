import vine from '@vinejs/vine'

/**
 * Validator for creating gym
 */
export const createGymValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255),
    description: vine.string().trim().minLength(3).maxLength(1000).optional(),
    address: vine.string().trim().maxLength(500).optional(),
    phone: vine.string().trim().maxLength(20).optional(),
    email: vine
      .string()
      .trim()
      .email()
      .normalizeEmail()
      .maxLength(255)
      .unique(async (db, value) => {
        const gym = await db.from('gyms').where('email', value).first()
        return !gym
      })
      .optional(),
    cnpj: vine
      .string()
      .trim()
      .maxLength(18)
      .unique(async (db, value) => {
        const gym = await db.from('gyms').where('cnpj', value).first()
        return !gym
      })
      .optional(),
    published: vine.boolean().optional(),
  })
)

/**
 * Validator for updating gym
 */
export const updateGymValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255).optional(),
    description: vine.string().trim().minLength(3).maxLength(1000).optional(),
    address: vine.string().trim().maxLength(500).optional(),
    phone: vine.string().trim().maxLength(20).optional(),
    email: vine.string().trim().email().normalizeEmail().maxLength(255).optional(),
    cnpj: vine.string().trim().maxLength(18).optional(),
    published: vine.boolean().optional(),
  })
)
