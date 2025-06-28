import { Request, Response } from 'express';
import Training from '../models/Training';
import { trainingSchema } from '../validations/trainingSchema';

export const getTraining = async (req: Request, res: Response) => {
    if (!req.user) {
        res.status(401).json({
            status: 'error',
            message: 'Usuário não autenticado'
        });
        return;
    }

    try {
        if (req.params.id) {
            // Se um ID for fornecido, busca o treinamento específico
            const training = await Training.findById(req.params.id).exec();

            if (!training) {
                res.status(404).json({
                    status: 'error',
                    message: 'Dados de treinamento não encontrados'
                });
                return;
            }

            res.status(200).json({
                status: 'success',
                message: 'Dados de treinamento recuperados com sucesso',
                data: training
            });

            return;
        }

        // Simulação de dados de treinamento
        const training = await Training.find({ user: req.user._id }).exec();

        res.status(200).json({
            status: 'success',
            message: 'Dados de treinamento recuperados com sucesso',
            data: training
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar dados de treinamento'
        });
    }
};

export const postTraining = async (req: Request, res: Response) => {

    if (!req.user) {
        res.status(401).json({
            status: 'error',
            message: 'Usuário não autenticado'
        });
        return;
    }

    try {

        if (!req.user.isAdmin) {
            res.status(403).json({
                status: 'error',
                message: 'Acesso negado. Apenas administradores podem criar dados de treinamento.'
            });
            return;
        }

        const result = trainingSchema.safeParse(req.body);

        if (!result.success) {
            console.log(result.error);
            res.status(400).json({
                status: 'error',
                message: 'Erro de validação',
                errors: result.error.errors.map(err => ({
                    field: err.path[0],
                    message: err.message
                }))
            });
            return;
        }

        let training = await Training.findById(result.data._id).exec();

        if (!training) {
            // Criação de um novo registro de treinamento
            training = new Training({ ...result.data, ...{ createdAt: new Date(), updatedAt: new Date() } });
            await training.save();
        } else {
            training.set({ ...result.data, ...{ updatedAt: new Date() } });
            await training.save();
        }

        res.status(201).json({
            status: 'success',
            message: 'Dados de treinamento salvos com sucesso',
            data: training
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao salvar dados de treinamento'
        });
    }

};

export const putTraining = async (req: Request, res: Response) => {

    if (!req.user) {
        res.status(401).json({
            status: 'error',
            message: 'Usuário não autenticado'
        });
        return;
    }

    try {

        if (!req.user.isAdmin) {
            res.status(403).json({
                status: 'error',
                message: 'Acesso negado. Apenas administradores podem criar dados de treinamento.'
            });
            return;
        }

        const result = trainingSchema.safeParse(req.body);

        if (!result.success) {
            res.status(400).json({
                status: 'error',
                message: 'Erro de validação',
                errors: result.error.errors.map(err => ({
                    field: err.path[0],
                    message: err.message
                }))
            });
            return;
        }

        // Atualização do registro de treinamento
        const training = await Training.findByIdAndUpdate(
            req.params.id,
            { ...result.data, ...{ updatedAt: new Date() } },
            { new: true }
        ).exec();

        if (!training) {
            res.status(404).json({
                status: 'error',
                message: 'Dados de treinamento não encontrados'
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            message: 'Dados de treinamento atualizados com sucesso',
            data: training
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao atualizar dados de treinamento'
        });
    }

};
