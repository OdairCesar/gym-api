import { Request, Response } from 'express'
import Diet from '../models/Diet'
import { createDietSchema, updateDietSchema } from '../validations/dietSchema'

export const createDiet = async (req: Request, res: Response) => {
  if (!req.user || (!req.user.isAdmin && !req.user.isPersonal)) {
    res.status(403).json({
      status: 'error',
      message:
        'Acesso negado. Apenas administradores ou personal trainers podem criar dietas.',
    })
    return
  }

  try {
    const parsed = createDietSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        message: 'Erro de validação',
        errors: parsed.error.flatten().fieldErrors,
      })
      return
    }

    let data = {}

    if (req.user._id && req.user.isPersonal)
      data = { ...parsed.data, criador: req.user._id }
    if (req.user.isAdmin) data = { ...parsed.data, criador: null }

    const diet = await Diet.create(data)

    if (!diet) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao criar dieta',
      })
      return
    }

    res.status(201).json({
      status: 'success',
      message: 'Dieta criada com sucesso',
      data: diet,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao criar dieta',
    })
  }
}

export const getAllDiets = async (req: Request, res: Response) => {
  try {
    if (!req.user || (!req.user.isAdmin && !req.user.isPersonal)) {
      res.status(401).json({
        status: 'error',
        message:
          'Usuário não autenticado ou sem permissão para acessar as dietas',
      })
      return
    }

    let find = {}

    if (req.user.isPersonal) find = { criador: req.user._id }

    const diets = await Diet.find(find).exec()

    res.status(200).json({
      status: 'success',
      message: 'Dietas encontradas com sucesso',
      data: diets,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar dietas',
    })
  }
}

export const getDiet = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.isAdmin || req.user.isPersonal) {
      res.status(401).json({
        status: 'error',
        message:
          'Usuário não autenticado ou sem permissão para acessar a dieta',
      })
      return
    }

    const diet = await Diet.findById(req.user.diet_id).exec()

    if (!diet) {
      res.status(404).json({
        status: 'error',
        message: 'Dieta não encontrada',
      })
      return
    }

    res.status(200).json({
      status: 'success',
      message: 'Dieta encontrada com sucesso',
      data: diet,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar dieta',
    })
  }
}

export const getDietById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Usuário não autenticado',
      })
      return
    }

    if (!req.user.isPersonal && !req.user.isAdmin) {
      if (!req.user.diet_id || req.user.diet_id.toString() !== req.params.id) {
        res.status(403).json({
          status: 'error',
          message:
            'Acesso negado. Apenas administradores ou criador da dieta pode visualizá-la.',
        })
        return
      }
    }

    let find = {}
    if (req.params.id) find = { ...find, _id: req.params.id }
    if (req.user.isPersonal) find = { ...find, criador: req.user._id }

    const diet = await Diet.findOne(find).exec()

    if (!diet) {
      res.status(404).json({
        status: 'error',
        message: 'Dieta não encontrada',
      })
      return
    }

    res.status(200).json({
      status: 'success',
      message: 'Dieta encontrada com sucesso',
      data: diet,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar dieta',
    })
  }
}

export const updateDiet = async (req: Request, res: Response) => {
  try {
    if (!req.user || (!req.user.isAdmin && !req.user.isPersonal)) {
      res.status(401).json({
        status: 'error',
        message:
          'Usuário não autenticado ou sem permissão para atualizar a dieta',
      })
      return
    }

    let find = {}
    if (req.params.id) find = { ...find, _id: req.params.id }
    if (req.user.isPersonal) find = { ...find, criador: req.user._id }

    const diet = await Diet.findOne(find).exec()

    if (!diet) {
      res.status(404).json({
        status: 'error',
        message: 'Dieta não encontrada',
      })
      return
    }

    const parsed = updateDietSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        message: 'Erro de validação',
        errors: parsed.error.flatten().fieldErrors,
      })
      return
    }

    const updated = await Diet.findByIdAndUpdate(req.params.id, parsed.data, {
      new: true,
      runValidators: true,
    }).exec()

    if (!updated) {
      res.status(404).json({
        status: 'error',
        message: 'Dieta não encontrada ou não atualizada',
      })
      return
    }

    res.status(200).json({
      status: 'success',
      message: 'Dieta atualizada com sucesso',
      data: updated,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao atualizar dieta',
    })
  }
}
