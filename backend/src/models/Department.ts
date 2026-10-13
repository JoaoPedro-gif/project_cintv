import { Schema, model } from 'mongoose';

const schema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: String,
  isActive: { type: Boolean, default: true },
});
export const Department = model('Department', schema);
