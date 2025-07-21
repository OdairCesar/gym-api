import { NextFunction, Request, Response } from 'express'
import User from '../models/User'
import bcrypt from 'bcryptjs'
import { editUserSchema, registerSchema } from '../validations/authValidations'
import { generateToken } from '../utils/generateToken'

export const createUser = async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body)

  if (!result.success) {
    res.status(400).json({
      status: 'error',
      message: 'Erro de validação',
      errors: result.error.errors.map((err) => ({
        field: err.path[0],
        message: err.message,
      })),
    })
    return
  }

  const { email, password } = result.data

  const userExists = await User.findOne({ email })

  if (userExists) {
    res.status(400).json({
      status: 'error',
      message: 'Usuário já existe',
    })
    return
  }

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  const user = await User.create({
    ...result.data,
    ...{ password: hashedPassword },
  })

  if (!user) {
    res.status(400).json({
      status: 'error',
      message: 'Falha ao criar usuário',
    })
    return
  }

  res.status(201).json({
    status: 'success',
    message: 'Usuário criado com sucesso',
    data: {
      user,
      token: generateToken(user.email.toString()),
    },
  })
}

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado',
      })
      return
    }

    const user = await User.findById(req.user.id).select('-password')

    res.status(200).json({
      status: 'success',
      message: 'Usuário encontrado',
      data: user,
    })

    next()
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar usuário',
    })
  }
}

export const getUserById = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({
        status: 'error',
        message: 'Acesso não autorizado',
      })
      return
    }

    const user = await User.findById(req.params.id).select('-password')

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado',
      })
      return
    }

    if (!req.user.isAdmin && user.isAdmin) {
      res.status(403).json({
        status: 'error',
        message: 'Acesso não autorizado',
      })
      return
    }

    res.status(200).json({
      status: 'success',
      message: 'Usuário encontrado',
      data: user,
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar usuário',
    })
  }
}

export const getUsers = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado',
      })
      return
    }

    if (!req.user?.isAdmin) {
      res.status(403).json({
        status: 'error',
        message: 'Acesso não autorizado',
      })
      return
    }

    const {
      name,
      email,
      telefone,
      endereco,
      profissao,
      cpf,
      sexo,
      isAdmin,
      isPersonal,
      isActive,
    } = req.query

    let query = {}

    if (name) query = { ...query, name: { $regex: name, $options: 'i' } }
    if (email) query = { ...query, email: { $regex: email, $options: 'i' } }
    if (telefone)
      query = { ...query, telefone: { $regex: telefone, $options: 'i' } }
    if (endereco)
      query = { ...query, endereco: { $regex: endereco, $options: 'i' } }
    if (profissao)
      query = { ...query, profissao: { $regex: profissao, $options: 'i' } }

    if (cpf) query = { ...query, cpf }
    if (sexo) query = { ...query, sexo }
    if (isPersonal !== undefined)
      query = { ...query, isPersonal: isPersonal === 'true' }
    if (isAdmin !== undefined) query = { ...query, isAdmin: isAdmin === 'true' }
    if (isActive !== undefined)
      query = { ...query, isActive: isActive === 'true' }

    const users = await User.find(query).select('-password')

    res.status(200).json({
      status: 'success',
      message: 'Usuários encontrados',
      data: users,
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar usuários',
    })
  }
}

export const updateUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado',
      })
      return
    }

    const result = editUserSchema.safeParse(req.body)

    if (!result.success) {
      res.status(400).json({
        status: 'error',
        message: 'Erro de validação',
        errors: result.error.errors.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      })
      return
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { ...result.data, password: req.user.password },
      { new: true, runValidators: true },
    ).select('-password')

    if (!updatedUser) {
      res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado',
      })
      return
    }

    res.status(200).json({
      status: 'success',
      message: 'Usuário atualizado',
      data: updatedUser,
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao atualizar usuário',
    })
  }
}

export const updateUserById = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({
        status: 'error',
        message: 'Acesso não autorizado',
      })
      return
    }

    const result = editUserSchema.safeParse(req.body)

    if (!result.success) {
      res.status(400).json({
        status: 'error',
        message: 'Erro de validação',
        errors: result.error.errors.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      })
      return
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { ...result.data, password: req.user.password },
      { new: true, runValidators: true },
    ).select('-password')

    if (!updatedUser) {
      res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado',
      })
      return
    }

    res.status(200).json({
      status: 'success',
      message: 'Usuário atualizado',
      data: updatedUser,
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao atualizar usuário',
    })
  }
}
