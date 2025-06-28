import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/generateToken';
import { registerSchema, loginSchema } from '../validations/authValidations';

export const registerUser = async (req: Request, res: Response) => {
    // Validação Zod
    const result = registerSchema.safeParse(req.body);

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

    const { email, password } = result.data;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({
            status: 'error',
            message: 'Usuário já existe'
        });
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ ...result.data, ...{ password: hashedPassword } });

    if (!user) {
        res.status(400).json({
            status: 'error',
            message: 'Falha ao criar usuário'
        });
        return;
    }

    res.status(201).json({
        status: 'success',
        message: 'Usuário criado com sucesso',
        data: {
            user: user,
            token: generateToken(user.email.toString())
        }
    });
};

export const loginUser = async (req: Request, res: Response) => {
    // Validação Zod
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
        res.status(400).json({
            status: 'error',
            message: 'Erro de validação verifique os campos',
            errors: result.error.errors.map(err => ({
                field: err.path[0],
                message: err.message
            }))
        });
        return;
    }

    const { email, password } = result.data;

    const user = await User.findOne({ email });

    if (!user) {
        res.status(401).json({
            status: 'error',
            message: 'Email ou senha inválidos'
        });
        return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        res.status(401).json({
            status: 'success',
            message: 'Email ou senha inválidos'
        });
        return;
    }

    res.json({
        status: 'success',
        message: 'Usuário criado com sucesso',
        data: {
            user: user,
            token: generateToken(user.email.toString())
        }
    });
};
