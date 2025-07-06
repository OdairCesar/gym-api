import { Request, Response } from 'express'
import User from '../models/User'
import bcrypt from 'bcryptjs'
import { generateToken } from '../utils/generateToken'
import { loginSchema } from '../validations/authValidations'

export const loginUser = async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body)

  if (!result.success) {
    res.status(400).json({
      status: 'error',
      message: 'Erro de validação verifique os campos',
      errors: result.error.errors.map((err) => ({
        field: err.path[0],
        message: err.message,
      })),
    })
    return
  }

  const { email, password } = result.data

  const user = await User.findOne({ email })

  if (!user) {
    res.status(401).json({
      status: 'error',
      message: 'Email ou senha inválidos',
    })
    return
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    res.status(401).json({
      status: 'error',
      message: 'Email ou senha inválidos',
    })
    return
  }

  res.json({
    status: 'success',
    message: 'Login realizado com sucesso',
    data: {
      user,
      token: generateToken(user.email.toString()),
    },
  })
}

export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado',
      })
      return
    }

    const { currentPassword, newPassword, newPasswordConfirm } = req.body

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      res.status(400).json({
        status: 'error',
        message: 'Todos os campos são obrigatórios',
      })
      return
    }

    if (newPassword !== newPasswordConfirm) {
      res.status(400).json({
        status: 'error',
        message: 'As novas senhas não coincidem',
      })
      return
    }

    const isMatch = await bcrypt.compare(currentPassword, req.user.password)
    if (!isMatch) {
      res.status(400).json({
        status: 'error',
        message: 'Senha atual incorreta',
      })
      return
    }

    const user = await User.findById(req.user.id)
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado',
      })
      return
    }

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    res.status(200).json({
      status: 'success',
      message: 'Senha alterada com sucesso',
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao alterar senha',
    })
  }
}
