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

/**
 * Validator for adding exercise to training
 */
export const addExerciseToTrainingValidator = vine.compile(
  vine.object({
    exerciseId: vine
      .number()
      .positive()
      .exists(async (db, value) => {
        const exercise = await db.from('exercises').where('id', value).first()
        return !!exercise
      }),
    name: vine.string().trim().minLength(3).maxLength(255).optional(),
    reps: vine.string().trim().maxLength(50).optional(),
    type: vine.enum(['aerobico', 'musculacao', 'flexibilidade', 'outro']).optional(),
    weight: vine.number().min(0).optional(),
    restSeconds: vine.number().min(0).max(600).optional(),
    videoLink: vine.string().trim().maxLength(500).optional(),
    priority: vine.number().min(0).max(100).optional(),
  })
)
