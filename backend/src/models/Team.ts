import { Schema, model } from 'mongoose';

const schema = new Schema({
  name: { type: String, required: true, trim: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
  leaderId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
});
export const Team = model('Team', schema);
