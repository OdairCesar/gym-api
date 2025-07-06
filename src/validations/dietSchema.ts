import { z } from 'zod'

export const mealSchema = z.object({
  nome: z.string().min(1, 'O nome da refeição é obrigatório'),
  descricao: z.string().optional(),
  horario: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Formato de horário inválido (use HH:mm)')
    .optional(),
  alimentos: z.array(z.string()).default([]),
})

export const createDietSchema = z.object({
  nome: z.string().min(1, 'O nome da dieta é obrigatório'),
  descricao: z.string().optional(),
  calorias: z.number().optional(),
  proteinas: z.number().optional(),
  carboidratos: z.number().optional(),
  gorduras: z.number().optional(),
  refeicoes: z.array(mealSchema).optional(),
})

export const updateDietSchema = createDietSchema.partial()
