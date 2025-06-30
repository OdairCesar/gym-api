import { NextFunction, Request, Response } from 'express';
import Product from '../models/Product';
import { createProductSchema, updateProductSchema } from '../validations/productSchema';

export const createProduct = async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.isAdmin) {
            res.status(403).json({
                status: 'error',
                message: 'Acesso não autorizado',
            });
            return;
        }

        const parsed = createProductSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({
                status: 'error',
                message: 'Erro de validação',
                errors: parsed.error.errors.map(err => ({
                    field: err.path[0],
                    message: err.message,
                })),
            });
            return;
        }

        const existing = await Product.findOne({ codigo: parsed.data.codigo });
        if (existing) {
            res.status(400).json({
                status: 'error',
                message: 'Já existe um produto com este código.',
            });
            return;
        }

        const product = new Product(parsed.data);
        await product.save();

        res.status(201).json({
            status: 'success',
            message: 'Produto criado com sucesso',
            data: product,
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Erro interno ao criar produto',
        });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.isAdmin) {
            res.status(403).json({
                status: 'error',
                message: 'Acesso não autorizado',
            });
            return;
        }
        
        const parsed = updateProductSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({
                status: 'error',
                message: 'Erro de validação',
                errors: parsed.error.errors.map(err => ({
                    field: err.path[0],
                    message: err.message,
                })),
            });
            return;
        }

        const updated = await Product.findByIdAndUpdate(req.params.id, parsed.data, {
            new: true,
            runValidators: true,
        });

        if (!updated) {
            res.status(404).json({
                status: 'error',
                message: 'Produto não encontrado',
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            message: 'Produto atualizado com sucesso',
            data: updated,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Erro interno ao atualizar produto',
        });
    }
};


export const getProductById = async (req: Request, res: Response) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            res.status(404).json({
                status: 'error',
                message: 'Produto não encontrado',
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            data: product,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Erro interno ao buscar produto',
        });
    }
};

export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const { nome, categoria, ativo, codigo } = req.query;

        const query: any = {};

        if (nome) query.nome = { $regex: nome, $options: 'i' };
        if (categoria) query.categoria = { $regex: categoria, $options: 'i' };
        if (codigo) query.codigo = { $regex: codigo, $options: 'i' };
        if (ativo !== undefined) query.ativo = ativo === 'true';

        const products = await Product.find(query);

        res.status(200).json({
            status: 'success',
            message: 'Produtos encontrados',
            data: products,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Erro interno ao buscar produtos',
        });
    }
};
