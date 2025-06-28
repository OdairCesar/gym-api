import mongoose, { Schema, Document } from 'mongoose';
import { nullable } from 'zod';

export interface ITraining extends Document {
  user: string;
  nome: string;
  treinador: string;
  exercicios: IExercicio[];
}

export interface IExercicio {
  nome: string;
  series: string;
  tipo: 'aerobico' | 'musculacao' | 'flexibilidade' | 'outro';
  carga: number;
  descanso: number;
  ordem: number;
  videoUrl?: string; // URL opcional para vídeo do exercício
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
        tipo: { type: String, enum: ['aerobico', 'musculacao', 'flexibilidade', 'outro'], required: true },
        carga: { type: Number, nullable: true }, // Carga opcional
        descanso: { type: Number, nullable: true }, // Descanso opcional
        ordem: { type: Number, required: true },
        videoUrl: { type: String, nullable: true } // URL opcional para vídeo do exercício
      }
    ]
  },
  {
    timestamps: true // Cria automaticamente createdAt e updatedAt
  }
);

export default mongoose.model<ITraining>('Training', TrainingSchema);
