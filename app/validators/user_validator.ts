import vine from '@vinejs/vine'

/**
 * Validator for creating user
 */
export const createUserValidator = vine.compile(
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
      })
      .optional(),
    dietId: vine
      .number()
      .positive()
      .exists(async (db, value) => {
        const diet = await db.from('diets').where('id', value).first()
        return !!diet
      })
      .optional()      .nullable(),
    isAdmin: vine.boolean().optional(),
    isPersonal: vine.boolean().optional(),
    isSuper: vine.boolean().optional(),
    published: vine.boolean().optional(),
  })
)

/**
 * Validator for updating user
 */
export const updateUserValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(255).optional(),
    email: vine
      .string()
      .trim()
      .email()
      .normalizeEmail()
      .unique(async (db, value, field) => {
        const user = await db
          .from('users')
          .where('email', value)
          .whereNot('id', field.meta.userId)
          .first()
        return !user
      })
      .optional(),
    password: vine.string().minLength(8).maxLength(255).optional(),
    birthDate: vine.date().optional().nullable(),
    phone: vine.string().trim().minLength(10).maxLength(20).optional().nullable(),
    cpf: vine
      .string()
      .trim()
      .regex(/^\d{11}$/)
      .unique(async (db, value, field) => {
        const user = await db
          .from('users')
          .where('cpf', value)
          .whereNot('id', field.meta.userId)
          .first()
        return !user
      })
      .optional()
      .nullable(),
    gender: vine.enum(['M', 'F', 'O']).optional().nullable(),
    profession: vine.string().trim().maxLength(255).optional().nullable(),
    address: vine.string().trim().maxLength(500).optional().nullable(),
    gymId: vine
      .number()
      .positive()
      .exists(async (db, value) => {
        const gym = await db.from('gyms').where('id', value).first()
        return !!gym
      })
      .optional(),
    dietId: vine
      .number()
      .positive()
      .exists(async (db, value) => {
        const diet = await db.from('diets').where('id', value).first()
        return !!diet
      })
      .optional()
      .nullable(),
    isAdmin: vine.boolean().optional(),
    isPersonal: vine.boolean().optional(),
    published: vine.boolean().optional(),
  })
)
