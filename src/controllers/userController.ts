import { NextFunction, Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { editUserSchema } from '../validations/authValidations';

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            res.status(404).json({
                status: 'error',
                message: 'Usuário não encontrado'
            });
            return;
        }

        const user = await User.findById(req.user.id).select('-password');

        res.status(200).json({
            status: 'success',
            message: 'Usuário encontrado',
            data: user
        });

        next();
        return;
    } catch (error) {

        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar usuário'
        });
        
    }
};


export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            res.status(404).json({
                status: 'error',
                message: 'Usuário não encontrado'
            });
            return;
        }

        if (!req.user?.isAdmin) {
            res.status(403).json({
                status: 'error',
                message: 'Acesso não autorizado',
            });
            return;
        }

        const {
            name,
            email,
            phone,
            address,
            profession,
            cpf,
            gender,
            isAdmin,
            isActive,
        } = req.query;

        const query: any = {};

        // Filtros "LIKE" (Regex)
        if (name) query.name = { $regex: name, $options: 'i' };
        if (email) query.email = { $regex: email, $options: 'i' };
        if (phone) query.phone = { $regex: phone, $options: 'i' };
        if (address) query.address = { $regex: address, $options: 'i' };
        if (profession) query.profession = { $regex: profession, $options: 'i' };

        // Filtros "MATCH"
        if (cpf) query.cpf = cpf;
        if (gender) query.gender = gender;
        if (isAdmin !== undefined) query.isAdmin = isAdmin === 'true';
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const users = await User.find(query).select('-password');

        res.status(200).json({
            status: 'success',
            message: 'Usuários encontrados',
            data: users,
        });

        next();
        return;

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao buscar usuários',
        });
    }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            res.status(404).json({
                status: 'error',
                message: 'Usuário não encontrado'
            });
            return;
        }

        const result = editUserSchema.safeParse(req.body);

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

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { ...result.data, password: req.user.password }, // Mantém a senha atual
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            res.status(404).json({
                status: 'error',
                message: 'Usuário não encontrado'
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            message: 'Usuário atualizado',
            data: updatedUser
        });

        next();
        return;
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao atualizar usuário'
        });
    }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            res.status(404).json({
                status: 'error',
                message: 'Usuário não encontrado'
            });
            return;
        }

        const { currentPassword, newPassword, newPasswordConfirm } = req.body;

        if (!currentPassword || !newPassword || !newPasswordConfirm) {
            res.status(400).json({
                status: 'error',
                message: 'Todos os campos são obrigatórios'
            });
            return;
        }

        if (newPassword !== newPasswordConfirm) {
            res.status(400).json({
                status: 'error',
                message: 'As novas senhas não coincidem'
            });
            return;
        }

        const isMatch = await bcrypt.compare(currentPassword, req.user.password);
        if (!isMatch) {
            res.status(400).json({
                status: 'error',
                message: 'Senha atual incorreta'
            });
            return;
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            res.status(404).json({
                status: 'error',
                message: 'Usuário não encontrado'
            });
            return;
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Senha alterada com sucesso'
        });

        next();
        return;

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao alterar senha'
        });
    }
};
