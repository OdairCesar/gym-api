import vine from '@vinejs/vine'

/**
 * Validator for creating exercise
 */
export const createExerciseValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(255),
    reps: vine.string().trim().maxLength(50).optional(), // Ex: "3x12", "4x8-10"
    type: vine.enum(['aerobico', 'musculacao', 'flexibilidade', 'outro']),
    weight: vine.number().min(0).optional(), // Em kg
    restSeconds: vine.number().min(0).max(600).optional(), // Descanso em segundos
    videoLink: vine.string().trim().maxLength(500).optional().nullable(),
    priority: vine.number().min(0).max(100).optional(), // Ordem/prioridade do exercício
  })
)

/**
 * Validator for updating exercise
 */
export const updateExerciseValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(255).optional(),
    reps: vine.string().trim().maxLength(50).optional(),
    type: vine.enum(['aerobico', 'musculacao', 'flexibilidade', 'outro']).optional(),
    weight: vine.number().min(0).optional(),
    restSeconds: vine.number().min(0).max(600).optional(),
    videoLink: vine.string().trim().maxLength(500).optional().nullable(),
    priority: vine.number().min(0).max(100).optional(),
  })
)
