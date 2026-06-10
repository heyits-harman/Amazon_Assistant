import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalysis extends Document {
  asin: string;
  analysis: string;
  userProfile: {
    age: string;
    gender: string;
    useCase: string;
  };
  createdAt: Date;
}

const AnalysisSchema = new Schema({
  asin: { type: String, required: true },
  analysis: { type: String, required: true },
  userProfile: {
    age: { type: String },
    gender: { type: String },
    useCase: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IAnalysis>('Analysis', AnalysisSchema);