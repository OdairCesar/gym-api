// src/validations/userSchema.ts
import { z } from 'zod';

export const userSchema = z.object({
  _id: z.string().optional(),
  nome: z.string(),
  email: z.string().email({ message: 'E-mail inválido' }),
  sexo: z.enum(['M', 'F', 'O']),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
  dataNascimento: z.date().transform((val) => new Date(val)).optional(),
  telefone: z.string().transform((val) => val.trim().replace(/[^0-9]/g, '')).optional(),
  cpf: z.string().optional(),
  profissao: z.string().optional(),
  endereco: z.string().optional(),
  diet_id: z.string().optional(),
  isAdmin: z.boolean().default(false),
  isPersonal: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

// Criar o tipo TypeScript automaticamente a partir do schema
export type UserType = z.infer<typeof userSchema>;
