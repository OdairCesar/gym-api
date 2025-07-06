import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1]

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        email: string
      }

      const user = await User.findOne({ email: decoded.email }).exec()

      if (!user) {
        res.status(401).json({
          status: 'error',
          message: 'Usuário não encontrado',
        })

        return
      }

      req.user = user

      next()
      return
    } catch (error) {
      res.status(401).json({
        status: 'error',
        message: 'Token inválido',
      })
      return
    }
  }

  res.status(401).json({
    status: 'error',
    message: 'Token não fornecido',
  })
}
