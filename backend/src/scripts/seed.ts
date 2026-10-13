import mongoose from 'mongoose';
import { connectDb } from '../config/db';
import { PRESETS } from '../config/permissions';
import { Department } from '../models/Department';
import { Role } from '../models/Role';

const CATALOG: Record<string, [string, keyof typeof PRESETS][]> = {
  Dados: [['Engenheiro de Dados', 'engineer'], ['Analista de Dados', 'analyst'],
    ['Engenheiro de Analytics', 'engineer'], ['Desenvolvedor de BI', 'engineer'],
    ['Cientista de Dados', 'specialist'], ['Líder de Dados', 'leader']],
  Marketing: [['Analista de Marketing', 'analyst'], ['Analista de Campanhas', 'analyst'],
    ['Coordenador de Marketing', 'coordinator'], ['Líder de Marketing', 'leader']],
  Negócios: [['Analista de Negócios', 'analyst'], ['Analista Comercial', 'analyst'],
    ['Coordenador de Negócios', 'coordinator'], ['Líder de Negócios', 'leader']],
  SFE: [['Analista de SFE', 'analyst'], ['Especialista de SFE', 'specialist'],
    ['Coordenador de SFE', 'coordinator'], ['Líder de SFE', 'leader']],
};

async function main() {
  await connectDb();
  for (const [deptName, roles] of Object.entries(CATALOG)) {
    const dept = await Department.findOneAndUpdate({ name: deptName }, { name: deptName }, { upsert: true, new: true });
    for (const [name, preset] of roles) {
      await Role.updateOne({ name, departmentId: dept._id },
        { $set: { permissions: PRESETS[preset], isPublic: preset !== 'leader' } }, { upsert: true });
    }
  }
  await Role.updateOne({ name: 'Administrador', departmentId: null },
    { $set: { permissions: PRESETS.admin, isPublic: false } }, { upsert: true });
  console.log('Seed concluído (idempotente).');
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
