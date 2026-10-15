import mongoose from 'mongoose';
import { connectDb } from '../config/db';
import { PRESETS } from '../config/permissions';
import { Department } from '../models/Department';
import { Role } from '../models/Role';

type R = [string, keyof typeof PRESETS];
const CATALOG: Record<string, R[]> = {
  Dados: [['Engenheiro de Dados', 'engineer'], ['Analista de Dados', 'analyst'], ['Engenheiro de Analytics', 'engineer'],
    ['Desenvolvedor de BI', 'engineer'], ['Cientista de Dados', 'specialist'], ['Líder de Dados', 'leader']],
  Marketing: [['Analista de Marketing', 'analyst'], ['Analista de Campanhas', 'analyst'],
    ['Coordenador de Marketing', 'coordinator'], ['Líder de Marketing', 'leader']],
  Negócios: [['Analista de Negócios', 'analyst'], ['Analista Comercial', 'analyst'],
    ['Coordenador de Negócios', 'coordinator'], ['Líder de Negócios', 'leader']],
  SFE: [['Analista de SFE', 'analyst'], ['Especialista de SFE', 'specialist'],
    ['Coordenador de SFE', 'coordinator'], ['Líder de SFE', 'leader']],
  'Tecnologia da Informação': [['Analista de Suporte', 'analyst'], ['Desenvolvedor', 'engineer'],
    ['Analista de Infraestrutura', 'engineer'], ['Analista de Segurança da Informação', 'specialist'],
    ['Coordenador de TI', 'coordinator'], ['Líder de TI', 'leader']],
  'Recursos Humanos': [['Analista de RH', 'analyst'], ['Analista de Recrutamento e Seleção', 'analyst'],
    ['Business Partner de RH', 'specialist'], ['Coordenador de RH', 'coordinator'], ['Líder de RH', 'leader']],
  Financeiro: [['Analista Financeiro', 'analyst'], ['Analista Contábil', 'analyst'], ['Analista de Controladoria', 'specialist'],
    ['Coordenador Financeiro', 'coordinator'], ['Líder Financeiro', 'leader']],
  Comercial: [['Representante Comercial', 'analyst'], ['Analista de Vendas', 'analyst'], ['Executivo de Contas', 'specialist'],
    ['Coordenador Comercial', 'coordinator'], ['Líder Comercial', 'leader']],
  Jurídico: [['Analista Jurídico', 'analyst'], ['Advogado', 'specialist'],
    ['Coordenador Jurídico', 'coordinator'], ['Líder Jurídico', 'leader']],
  'Operações e Logística': [['Analista de Operações', 'analyst'], ['Analista de Logística', 'analyst'],
    ['Coordenador de Operações', 'coordinator'], ['Líder de Operações', 'leader']],
  'Atendimento ao Cliente': [['Atendente', 'analyst'], ['Analista de Atendimento', 'analyst'],
    ['Coordenador de Atendimento', 'coordinator'], ['Líder de Atendimento', 'leader']],
  Compras: [['Comprador', 'analyst'], ['Analista de Compras', 'analyst'],
    ['Coordenador de Compras', 'coordinator'], ['Líder de Compras', 'leader']],
  Administrativo: [['Assistente Administrativo', 'analyst'], ['Analista Administrativo', 'analyst'],
    ['Coordenador Administrativo', 'coordinator'], ['Líder Administrativo', 'leader']],
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