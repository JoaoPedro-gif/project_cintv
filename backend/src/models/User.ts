import { Schema, model } from 'mongoose';

const schema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    nickname: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null, index: true },
    isActive: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecretEncrypted: { type: String, select: false },
    recoveryCodeHashes: { type: [String], select: false, default: [] },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      // Nunca devolver dados sensíveis nas respostas da API
      transform: (_d, ret: Record<string, unknown>) => {
        delete ret.passwordHash; delete ret.twoFactorSecretEncrypted;
        delete ret.recoveryCodeHashes; delete ret.failedLoginAttempts; delete ret.lockUntil;
        return ret;
      },
    },
  },
);
export const User = model('User', schema);
