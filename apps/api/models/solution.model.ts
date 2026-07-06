import { Schema, model, Document } from 'mongoose';

export interface IStep {
  explanation: string;
  expression?: string;
}

export interface ISolution extends Document {
  id: string;
  problem: string;
  steps: IStep[];
  finalAnswer: string;
  createdAt: Date;
}

const stepSchema = new Schema<IStep>(
  {
    explanation: { type: String, required: true },
    expression: { type: String },
  },
  { _id: false },
);

const solutionSchema = new Schema<ISolution>(
  {
    problem: { type: String, required: true, trim: true },
    steps: { type: [stepSchema], required: true },
    finalAnswer: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const SolutionModel = model<ISolution>('Solution', solutionSchema);
