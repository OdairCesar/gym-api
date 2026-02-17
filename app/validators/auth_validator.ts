import vine from '@vinejs/vine'

/**
 * Validator for user registration
 */
export const registerValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(255),
    email: vine
      .string()
      .trim()
      .email()
      .normalizeEmail()
      .unique(async (db, value) => {
        const user = await db.from('users').where('email', value).first()
        return !user
      }),
    password: vine.string().minLength(8).maxLength(255),
    birthDate: vine.date().optional(),
    phone: vine.string().trim().minLength(10).maxLength(20).optional(),
    cpf: vine
      .string()
      .trim()
      .regex(/^\d{11}$/)
      .unique(async (db, value) => {
        const user = await db.from('users').where('cpf', value).first()
        return !user
      })
      .optional(),
    gender: vine.enum(['M', 'F', 'O']).optional(),
    profession: vine.string().trim().maxLength(255).optional(),
    address: vine.string().trim().maxLength(500).optional(),
    gymId: vine
      .number()
      .positive()
      .exists(async (db, value) => {
        const gym = await db.from('gyms').where('id', value).first()
        return !!gym
      }),
    isAdmin: vine.boolean().optional(),
    isPersonal: vine.boolean().optional(),
  })
)

/**
 * Validator for user login
 */
export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string().minLength(8),
  })
)
