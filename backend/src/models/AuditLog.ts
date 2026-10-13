import { Schema, model, Types } from 'mongoose';

const schema = new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  action: { type: String, required: true, index: true },
  resourceType: String,
  resourceId: String,
  metadata: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now, index: true },
});
// Retenção: 2 anos (ajuste conforme a política da empresa)
schema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 730 });
export const AuditLog = model('AuditLog', schema);

export const audit = (actorId: Types.ObjectId | string | undefined, action: string,
  resourceType?: string, resourceId?: string, metadata?: unknown) =>
  AuditLog.create({ actorId, action, resourceType, resourceId, metadata });
