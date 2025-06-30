import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  categoria?: string;
  codigo?: string;
  ativo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema: Schema = new Schema(
  {
    nome: { type: String, required: true },
    descricao: { type: String },
    preco: { type: Number, required: true },
    estoque: { type: Number, required: true }, // <- campo renomeado
    categoria: { type: String },
    codigo: { type: String, unique: true },
    ativo: { type: Boolean, default: true },
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IProduct>('Product', ProductSchema);
