import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  nome: string;
  email: string;
  password: string;
  dataNascimento?: Date;
  telefone?: string;
  cpf?: string;
  sexo?: 'M' | 'F' | 'O';
  profissao?: string;
  endereco?: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema: Schema = new Schema(
  {
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dataNascimento: { type: Date },
    telefone: { type: String },
    cpf: { type: String },
    sexo: { type: String, enum: ['M', 'F', 'O'] },
    profissao: { type: String },
    endereco: { type: String },
    isAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true // Cria automaticamente createdAt e updatedAt
  }
);

export default mongoose.model<IUser>('User', UserSchema);
