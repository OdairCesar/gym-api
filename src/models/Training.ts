import mongoose, { Schema, Document } from 'mongoose'

export interface IExercicio {
  nome: string
  series: string
  tipo: 'aerobico' | 'musculacao' | 'flexibilidade' | 'outro'
  carga: number
  descanso: number
  ordem: number
  videoUrl?: string
}

export interface ITraining extends Document {
  user: string
  nome: string
  treinador: string
  exercicios: IExercicio[]
}

const TrainingSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    nome: { type: String, required: true },
    treinador: { type: String, required: true },
    exercicios: [
      {
        nome: { type: String, required: true },
        series: { type: String, required: true },
        tipo: {
          type: String,
          enum: ['aerobico', 'musculacao', 'flexibilidade', 'outro'],
          required: true,
        },
        carga: { type: Number, nullable: true },
        descanso: { type: Number, nullable: true },
        ordem: { type: Number, required: true },
        videoUrl: { type: String, nullable: true },
      },
    ],
  },
  {
    timestamps: true,
  },
)

export default mongoose.model<ITraining>('Training', TrainingSchema)
