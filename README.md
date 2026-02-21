# 🏋️ Gym API - Sistema Multi-Tenant para Gestão de Academias

> API RESTful completa para gestão de academias com suporte multi-tenant, controle de dietas, treinos, produtos e sistema de permissões cross-tenant.

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![AdonisJS](https://img.shields.io/badge/AdonisJS-6.x-purple.svg)](https://adonisjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)

---

## 🎯 O que é?

**Gym API** é uma solução completa para gestão de múltiplas academias, permitindo:

- 🏢 **Multi-tenant:** Isolamento completo de dados por academia
- 👥 **Gestão de Usuários:** Clientes, Personals e Administradores
- 🥗 **Dietas Personalizadas:** Refeições e alimentos detalhados
- 💪 **Treinos Customizados:** Exercícios com séries, repetições e peso
- 🛍️ **Loja de Produtos:** Controle de estoque e vendas
- 🔐 **Permissões Cross-Tenant:** Colaboração entre academias diferentes

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js v20+
- MySQL 8.0+
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd gym-api-adonis

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Gere chave da aplicação
node ace generate:key

# Execute migrations
node ace migration:run

# (Opcional) Popule com dados de exemplo
node ace db:seed

# Inicie o servidor
npm run dev
```

Aplicação rodando em: `http://localhost:3333`

---

## 📚 Documentação

### 📖 Documentação Completa

- **[REQUIREMENTS.md](docs/REQUIREMENTS.md)** - Requisitos funcionais e não-funcionais completos
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Arquitetura, fluxogramas e diagramas
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Guia completo de deploy em produção
- **[PRODUCTION.md](docs/PRODUCTION.md)** - Manual de operação e manutenção

### 🛠️ Guias Técnicos

- **[docs/RATE_LIMITING.md](docs/RATE_LIMITING.md)** - Rate limiting e proteção anti-abuso
- **[docs/ERROR_MONITORING.md](docs/ERROR_MONITORING.md)** - Monitoramento de erros (Sentry)
- **[docs/OPTIMIZATIONS.md](docs/OPTIMIZATIONS.md)** - Otimizações e índices do banco
- **[docs/PAYMENT_SYSTEM.md](docs/PAYMENT_SYSTEM.md)** - Sistema de planos e pagamentos (Strategy Pattern)

### 📝 Outros Documentos

- **[Guia de Testes](docs/TESTS_README.md)** - Guia de testes funcionais
- **[Documentação dos Seeders](docs/SEEDERS_README.md)** - Documentação dos seeders

---

## 🏗️ Arquitetura

### Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | AdonisJS v6 |
| Linguagem | TypeScript 5.x |
| Banco de Dados | MySQL 8.0 |
| ORM | Lucid ORM |
| Autenticação | @adonisjs/auth (Bearer Tokens) |
| Autorização | @adonisjs/bouncer (Policies) |
| Rate Limiting | @adonisjs/limiter |
| Error Monitoring | Sentry (desacoplado) |
| Testes | Japa Framework |

### Estrutura do Projeto

```
gym-api-adonis/
├── app/
│   ├── controllers/       # 12 controladores REST
│   ├── models/            # 12 models com relacionamentos
│   ├── policies/          # 7 policies de autorização
│   ├── validators/        # 11 validators
│   ├── services/          # PermissionService + Error Monitoring
│   ├── middleware/        # Auth, RateLimit, ForceJson
│   └── exceptions/        # Exception handler com Sentry
├── database/
│   ├── migrations/        # 14 migrations SQL
│   └── seeders/           # 7 seeders com dados realistas
├── tests/
│   └── functional/        # 6 suítes, 50+ testes
├── docs/                  # Documentação técnica
└── start/
    ├── routes.ts          # Definição de rotas
    ├── limiter.ts         # Rate limiters configurados
    └── env.ts             # Validação de variáveis
```

### Multi-Tenancy

Isolamento lógico via `gym_id`:
- Todas queries filtradas automaticamente
- Policies garantem acesso apenas aos dados da academia
- Permissões cross-tenant via `Gympermission` e `Userpermission`

Ver diagrama completo em [ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## ✨ Funcionalidades

### ✅ Implementadas

- **Autenticação**
  - Registro de usuários
  - Login/Logout com tokens
  - Middleware de autenticação

- **Usuários**
  - CRUD completo
  - 4 níveis de acesso: Super, Admin, Personal, Cliente
  - Sistema de moderação: todos usuários precisam ser aprovados
  - Isolamento multi-tenant
  - Super users gerenciam o sistema globalmente (apenas via DB)

- **Dietas**
  - Criar dietas para clientes
  - Adicionar refeições e alimentos
  - Macronutrientes (proteína, carboidrato, gordura)
  - Nested resources: Diet → Meals → Foods

- **Treinos**
  - Criar treinos personalizados
  - Biblioteca de exercícios globais
  - Exercícios customizados por academia
  - Pivot table com séries, repetições, peso, descanso

- **Produtos**
  - CRUD de produtos
  - Controle de estoque
  - Categorização (suplemento, equipamento, vestuário)
  - Código único por academia

- **Academias**
  - Cadastro completo
  - Estatísticas (usuários, dietas, treinos)
  - Status published

- **Permissões Cross-Tenant**
  - Gym Permission: Academia → Personal externo
  - User Permission: Cliente → Personal/Academia específica
  - Controle granular (dietas, treinos)

- **Planos e Pagamento**
  - 3 planos: Inicial (Free, 25 usuários), Intermediário (R$ 50, 100 usuários), Ilimitado (R$ 100)
  - Sistema de assinaturas com status tracking (active, cancelled, past_due)
  - Provedores de pagamento: Free, Google Pay, Apple Pay (Strategy Pattern)
  - Validação de limites de recursos (limite de usuários por plano)
  - Assinatura automática ao criar academia (plano inicial gratuito)
  - Transações atômicas para operações de pagamento
  - Endpoints: `/gym-plans` (público), `/gym-subscriptions` (autenticado)

- **Segurança**
  - Rate limiting (5 req/min login, 100 req/min API)
  - Políticas de autorização
  - Senhas hasheadas (bcrypt)
  - Remoção automática de dados sensíveis
  - Sistema de moderação: usuários pendentes de aprovação

- **Moderação de Usuários**
  - Todos novos usuários ficam pendentes de aprovação
  - Admins/Personals aprovados podem aprovar novos usuários
  - Super users podem aprovar qualquer usuário
  - Endpoint para listar usuários pendentes
  - Endpoints para aprovar/rejeitar cadastros

- **Monitoramento**
  - Error monitoring (Sentry/desacoplado)
  - Logs estruturados
  - Health check endpoint

- **Otimizações**
  - 50+ índices no banco
  - Eager loading de relacionamentos
  - Connection pooling
  - PM2 cluster mode ready

---

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Testes específicos
npm test -- --files="tests/functional/auth.spec.ts"

# Com filtro
npm test -- --grep="should login"
```

### Cobertura

- **6 suítes de testes funcionais**
- **50+ cenários de teste**
- Cobertura completa de:
  - Autenticação e autorização
  - CRUD de todos recursos
  - Multi-tenancy e isolamento
  - Permissões cross-tenant
  - Rate limiting

Ver detalhes em [Guia de Testes](docs/TESTS_README.md).

---

## 📦 Seeders

Popule o banco com dados realistas:

```bash
node ace db:seed
```

**Inclui:**
- 3 academias
- 9 usuários (3 admins, 2 personals, 4 clientes)
- 3 dietas completas com refeições e alimentos
- 16 exercícios + 4 treinos personalizados
- 16 produtos categorizados
- 5 exemplos de permissões cross-tenant

**Credenciais:** Todos usuários têm senha `senha123`

Ver detalhes em [Documentação dos Seeders](docs/SEEDERS_README.md).

---

## 🚀 Deploy

### Produção Rápido

```bash
# Build
npm run build

# Instalar dependências de produção
cd build
npm ci --omit=dev

# Executar migrations
node ace migration:run --force

# Iniciar com PM2
pm2 start ecosystem.config.js --env production
```

### Documentação Completa

- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Guia completo de deploy
  - Configuração de servidor
  - Nginx reverse proxy
  - SSL com Let's Encrypt
  - PM2 cluster mode
  - Backups automáticos

- **[PRODUCTION.md](docs/PRODUCTION.md)** - Manual de operação
  - Monitoramento
  - Troubleshooting
  - Manutenção preventiva
  - Checklist semanal/mensal

---

## 📊 Status do Projeto

### ✅ Sprints Concluídas

- **Sprint 1** - Autenticação & Usuários
- **Sprint 2** - Dietas, Refeições, Alimentos, Treinos, Exercícios
- **Sprint 3** - Produtos, Academias, Permissões Cross-Tenant
- **Sprint 4** - Qualidade (Testes Funcionais + Seeders + Documentação API)
- **Sprint 5** - Monitoramento e Segurança (Rate Limiting + Error Monitoring)
- **Sprint 6** - Finalização (Otimizações + Deploy + Documentação Completa)
- **Sprint 7** - Reusabilidade (Dietas e Treinos Compartilhados + Clone)
- **Sprint 8** - Planos e Pagamento (Strategy Pattern + 3 Providers + Validação de Limites)

### 📈 Métricas

- **Controllers:** 14 (adicionados: Gymplans, Gymsubscriptions)
- **Models:** 14 (adicionados: Gymplan, Gymsubscription)
- **Policies:** 8 (adicionado: Subscription)
- **Validators:** 12 (adicionado: Gymsubscription)
- **Services:** 4 (adicionados: PaymentService, PlanLimitService)
- **Strategies:** 3 (FreePlan, GooglePay, ApplePay)
- **Migrations:** 17 (adicionadas: gymplans, gymsubscriptions, add_subscription_to_gyms)
- **Seeders:** 8 (adicionado: Gymplan)
- **Tests:** 50+
- **Índices DB:** 50+
- **Documentação:** 5000+ linhas

---

## 🛡️ Segurança

### Implementado

- ✅ Autenticação via Bearer Tokens
- ✅ Autorização via Policies (Bouncer)
- ✅ Rate Limiting multi-nível
- ✅ Senhas hasheadas (bcrypt)
- ✅ Validação de input (validators)
- ✅ Remoção automática de dados sensíveis
- ✅ Multi-tenant isolation
- ✅ CORS configurado

### Recomendações

- [ ] Configurar HTTPS (SSL/TLS)
- [ ] Habilitar Sentry em produção
- [ ] Configurar firewall no servidor
- [ ] Realizar auditorias de segurança
- [ ] Manter dependências atualizadas

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Abra um Pull Request

### Padrões de Código

- ESLint + Prettier configurados
- Convenção snake_case para DB
- Convenção camelCase para TypeScript
- Policies para autorização
- Validators para validação

---

## 📄 Licença

Este projeto é proprietário.

---

## 📞 Suporte

Para questões e suporte:
- 📧 Email: support@gym-api.com
- 🐛 Issues: [GitHub Issues](https://github.com/seu-repo/gym-api/issues)
- 📚 Docs: Ver arquivos na pasta raiz e `docs/`

---

**Desenvolvido com ❤️ usando AdonisJS v6 + TypeScript**
