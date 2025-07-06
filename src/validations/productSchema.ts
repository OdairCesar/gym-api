import { z } from 'zod'

export const createProductSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  preco: z.number().nonnegative('Preço deve ser positivo'),
  estoque: z.number().int().nonnegative('Estoque deve ser um número positivo'),
  categoria: z.string().optional(),
  codigo: z.string().optional(),
  ativo: z.boolean().optional(),
})

export const updateProductSchema = createProductSchema.partial()
