import { z } from 'zod'

export const exercicioSchema = z.object({
  nome: z.string(),
  series: z.string(),
  tipo: z.enum(['aerobico', 'musculacao', 'flexibilidade', 'outro']),
  carga: z.number().optional().nullable(),
  descanso: z.number().optional().nullable(),
  ordem: z.number(),
  videoUrl: z.string().url().optional().nullable(),
})

export const trainingSchema = z.object({
  _id: z.string().optional(),
  user: z.string(),
  nome: z.string(),
  treinador: z.string(),
  exercicios: z.array(exercicioSchema),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type TrainingType = z.infer<typeof trainingSchema>
