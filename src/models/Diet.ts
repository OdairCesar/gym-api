import mongoose, { Document, Schema } from 'mongoose'

export interface IMeal {
  nome: string
  descricao?: string
  horario?: string
  alimentos: string[]
}

export interface IDiet extends Document {
  nome: string
  descricao?: string
  calorias?: number
  proteinas?: number
  carboidratos?: number
  gorduras?: number
  refeicoes: IMeal[]
  criador: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const MealSchema: Schema = new Schema<IMeal>(
  {
    nome: { type: String, required: true, trim: true },
    descricao: { type: String },
    horario: { type: String },
    alimentos: { type: [String], default: [] },
  },
  { 
    _id: false 
  }
)

const DietSchema: Schema = new Schema<IDiet>(
  {
    nome: { type: String, required: true, trim: true },
    descricao: { type: String },
    calorias: { type: Number },
    proteinas: { type: Number },
    carboidratos: { type: Number },
    gorduras: { type: Number },
    refeicoes: { type: [MealSchema], default: [] },
    criador: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model<IDiet>('Diet', DietSchema)
