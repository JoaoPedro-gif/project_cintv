# Plataforma de Dados

## Rodar no GitHub Codespaces (ou VS Code + Dev Containers)
O `.devcontainer` já sobe Node 22 + MongoDB 7. Depois que o ambiente abrir:

```bash
cp .env.example .env     # gere SESSION_SECRET e TWO_FACTOR_ENCRYPTION_KEY (veja comentários)
cd backend
npm run seed             # departamentos, funções e permissões (idempotente)
npm run create-admin     # primeiro administrador (senha digitada de forma oculta)
npm run dev              # http://localhost:4000/api/health
```

**Nunca** faça commit do `.env`. O repositório é público.
