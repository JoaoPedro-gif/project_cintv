import { Schema, model } from 'mongoose';

const schema = new Schema({
  name: { type: String, required: true, trim: true },
  permissions: { type: [String], default: [] },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
  // Só funções públicas aparecem no cadastro. Líder/Admin nunca são públicas.
  isPublic: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
});
schema.index({ name: 1, departmentId: 1 }, { unique: true });
export const Role = model('Role', schema);
