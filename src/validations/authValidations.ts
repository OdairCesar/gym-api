import { userSchema } from './userSchema'

export const registerSchema = userSchema.pick({
  nome: true,
  email: true,
  password: true,
  dataNascimento: true,
  telefone: true,
  cpf: true,
  sexo: true,
  profissao: true,
  endereco: true,
})

export const editUserSchema = userSchema.pick({
  nome: true,
  email: true,
  dataNascimento: true,
  telefone: true,
  cpf: true,
  sexo: true,
  profissao: true,
  endereco: true,
})

export const loginSchema = userSchema.pick({
  email: true,
  password: true,
})
