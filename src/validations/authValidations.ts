import { userSchema } from './userSchema';

// Validação de registro: exige nome, email e password, aceita outros campos opcionais
export const registerSchema = userSchema.pick({
  nome: true,
  email: true,
  password: true,
  dataNascimento: true,
  telefone: true,
  cpf: true,
  sexo: true,
  profissao: true,
  endereco: true
});

export const editUserSchema = userSchema.pick({
  nome: true,
  email: true,
  dataNascimento: true,
  telefone: true,
  cpf: true,
  sexo: true,
  profissao: true,
  endereco: true
});

// Validação de login: continua só email e password
export const loginSchema = userSchema.pick({
  email: true,
  password: true
});
