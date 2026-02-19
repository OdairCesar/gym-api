# 📋 Requisitos do Sistema - Gym API

## Documento de Requisitos v1.0 - MVP

> **⚠️ IMPORTANTE:** Este é um **MVP (Minimum Viable Product)** focado em funcionalidades essenciais para validação do negócio.

---

## 1. Objetivo do Sistema

Desenvolver uma API RESTful para gestão de múltiplas academias (multi-tenant) que permita controle completo de usuários, dietas, treinos e produtos, com sistema de permissões cross-tenant para colaboração entre academias.

**Foco do MVP:**
- Validar arquitetura multi-tenant
- Testar sistema de permissões cross-tenant
- CRUD básico de entidades principais
- Autenticação e autorização funcionais

---

## 2. Escopo do Projeto

### 2.1 Inclui (MVP)
- ✅ Gestão multi-tenant de academias
- ✅ Sistema de autenticação e autorização
- ✅ CRUD completo de usuários (4 tipos: Super, Admin, Personal, Cliente)
- ✅ Sistema de moderação e aprovação de usuários
- ✅ CRUD completo de dietas com refeições e alimentos
- ✅ CRUD completo de treinos com exercícios personalizados
- ✅ CRUD completo de produtos da academia
- ✅ Sistema de permissões cross-tenant (academia-personal e usuário-específico)
- ✅ Isolamento de dados por academia
- ✅ Sistema de planos de assinatura e pagamento (Free, Intermediário, Ilimitado)

### 2.2 Não Inclui (Fora do Escopo MVP)
- ❌ Interface web (frontend)
- ❌ Agendamento de aulas/horários
- ❌ Chat/mensagens entre usuários
- ❌ Gamificação/rankings
- ❌ Integração com dispositivos fitness
- ❌ Sistema de check-in/acesso físico
- ❌ Relatórios complexos e dashboards avançados
- ❌ Sistema de notificações (email/push/SMS)
- ❌ Upload de imagens/vídeos
- ❌ Internacionalização (i18n)
- ❌ Testes automatizados (será implementado pós-MVP)

---

## 3. Requisitos Funcionais Principais

### RF01 - Sistema Multi-Tenant
**Prioridade:** 🔴 ALTA

**Descrição:** O sistema deve suportar múltiplas academias independentes em uma única base de dados.

**Critérios de Aceitação:**
- Cada academia possui `gym_id` único
- Dados são isolados por academia (users, diets, trainings, products)
- Queries automáticas filtram por `gym_id`
- Cascade delete ao remover academia
- Academia possui: nome, descrição, endereço, telefone, email, CNPJ

---

### RF02 - Autenticação de Usuários
**Prioridade:** 🔴 ALTA

**Descrição:** Usuários devem poder se registrar e fazer login no sistema.

**Critérios de Aceitação:**
- Registro com: nome, email, senha, data nascimento, telefone, CPF, gênero, profissão, endereço
- Login com email e senha
- Senha criptografada (Scrypt)
- Geração de access token (Bearer)
- Logout invalida token
- Usuário vinculado a uma academia no registro
- **Moderação:** Novos usuários criados com `approved = false` (exceto quando criados por usuários aprovados)
- **Login:** Apenas usuários aprovados ou super users podem fazer login
- **Aprovação:** Super users, admins aprovados e personals aprovados podem aprovar usuários

**Campos do Usuário:**
```typescript
{
  id: number
  name: string
  email: string (único)
  password: string (criptografado)
  birthDate?: Date
  phone?: string
  cpf?: string (único)
  gender?: 'M' | 'F' | 'O'
  profession?: string
  address?: string
  gym_id: number (FK)
  diet_id?: number (FK)
  role: 'super' | 'admin' | 'personal' | 'user' (default: 'user')
  approved: boolean (default: false)
  approved_by?: number (FK - User)
  approved_at?: datetime
  published: boolean (default: true)
}
```

---

### RF03 - Autorização por Níveis de Acesso
**Prioridade:** 🔴 ALTA

**Descrição:** Sistema deve implementar 4 níveis de acesso com permissões distintas e sistema de moderação.

**Tipos de Usuário:**

#### 0. Super User (role: 'super') ⭐ ESPECIAL
- ✅ Criação exclusiva via banco de dados (não via API)
- ✅ Controle total de todas as academias
- ✅ Criar novas academias
- ✅ Aprovar/rejeitar qualquer usuário de qualquer academia
- ✅ Login imediato (não precisa aprovação)
- ✅ Bypass de isolamento multi-tenant

**⚠️ IMPORTANTE:** Super Users não podem ser criados via endpoints da API por segurança.

#### 1. Cliente (role: 'user')
- ✅ Visualizar dados (read-only)
- ✅ Editar próprio perfil
- ❌ Criar/editar/deletar recursos
- 🔒 **Requer aprovação** para fazer login

#### 2. Personal/Coach (role: 'personal')
- ✅ Visualizar dados
- ✅ Criar dietas e treinos
- ✅ Editar/deletar dietas e treinos que criou
- ✅ Editar/deletar usuários comuns da sua academia
- ❌ Editar admins ou outros personals
- ✅ Receber permissões cross-tenant
- ✅ **Se aprovado:** Pode aprovar novos usuários da sua academia
- 🔒 **Requer aprovação** para fazer login

#### 3. Admin (role: 'admin')
- ✅ Controle total da sua academia
- ✅ Criar/editar/deletar todos recursos da academia
- ✅ Gerenciar todos usuários da academia
- ✅ Conceder permissões a personals externos
- ✅ **Se aprovado:** Pode aprovar novos usuários da sua academia
- 🔒 **Requer aprovação** para fazer login

**Sistema de Moderação:**
- Todos os novos registros criam usuário com `approved = false`
- Usuários não aprovados podem receber token mas não fazer login no sistema
- Super Users, Admins aprovados e Personals aprovados podem aprovar outros usuários
- Endpoints de moderação: `GET /users/pending-users`, `POST /users/:id/approve-user`, `POST /users/:id/reject-user`

---

### RF04 - Gestão de Dietas
**Prioridade:** 🟡 MÉDIA

**Descrição:** Personal/Admin pode criar e gerenciar dietas para clientes.

**Estrutura:**
```
Diet (Dieta)
├── name: string
├── description?: string
├── calories?: number
├── proteins?: decimal
├── carbohydrates?: decimal
├── fats?: decimal
├── gym_id: number (FK)
├── creator_id?: number (FK - User)
├── is_reusable: boolean (default: false)
└── meals: Meal[]
    ├── name: string
    ├── description?: string
    ├── hourly?: string (ex: "08:00")
    └── foods: Food[]
        └── name: string
```

**Critérios de Aceitação:**
- CRUD completo de dietas (Personal/Admin)
- CRUD de refeições dentro da dieta
- CRUD de alimentos dentro da refeição
- Atribuir dieta a cliente (user.diet_id)
- Visualização read-only para clientes
- Dietas isoladas por academia
- Dietas reutilizáveis compartilhadas (`GET /diets/shared`)
- Clonar dieta existente (`POST /diets/:id/clone`)
- Informações nutricionais calculadas automaticamente (futuro)

---

### RF05 - Gestão de Treinos
**Prioridade:** 🟡 MÉDIA

**Descrição:** Personal/Admin pode criar e gerenciar treinos personalizados.

**Estrutura:**
```
Training (Treino)
├── name: string
├── description: string
├── gym_id: number (FK)
├── user_id: number (FK - cliente)
├── coach_id: number (FK - personal)
├── is_reusable: boolean (default: false)
└── exercises: Exercise[] (many-to-many)
    ├── name: string
    ├── reps: string (ex: "3x12")
    ├── type: 'aerobico' | 'funcional' | 'musculacao' | 'flexibilidade' | 'outro'
    ├── weight: decimal
    ├── rest_seconds: number
    ├── video_link?: string
    └── priority: number
```

**Critérios de Aceitação:**
- CRUD completo de treinos (Personal/Admin)
- CRUD de exercícios (reutilizáveis)
- Adicionar exercícios ao treino com personalização (`POST /trainings/:id/exercises`)
- Remover exercício do treino (`DELETE /trainings/:id/exercises/:exerciseId`)
- Personalização por treino: séries, peso, descanso customizados
- Exercícios compartilhados entre treinos
- Treinos reutilizáveis compartilhados (`GET /trainings/shared`)
- Clonar treino existente (`POST /trainings/:id/clone`)
- Cliente visualiza apenas seus treinos
- Personal visualiza treinos que criou
- Treinos isolados por academia

---

### RF06 - Gestão de Produtos
**Prioridade:** 🔵 BAIXA

**Descrição:** Academia pode cadastrar produtos para venda.

**Estrutura:**
```
Product
├── name: string
├── description?: string
├── price: decimal
├── stock: number
├── category?: string
├── code?: string (único por academia)
├── gym_id: number (FK)
└── published: boolean
```

**Critérios de Aceitação:**
- CRUD completo de produtos (Personal/Admin)
- Controle de estoque
- Publicar/despublicar produtos
- Código único por academia
- Produtos isolados por academia
- Visualização para todos usuários da academia

---

### RF07 - Permissões Cross-Tenant
**Prioridade:** 🟠 MÉDIA-ALTA

**Descrição:** Sistema permite colaboração entre academias através de permissões específicas.

#### Tipo 1: Academia → Personal Externo

**Tabela:** `gym_permissions`

**Estrutura:**
```typescript
{
  id: number
  gym_id: number          // Academia que concede
  personal_id: number     // Personal que recebe
  can_edit_diets: boolean
  can_edit_trainings: boolean
  is_active: boolean
}
```

**Critérios de Aceitação:**
- Academia pode autorizar personal de outra academia
- Permissões granulares (dietas, treinos)
- Personal acessa TODOS recursos permitidos da academia
- Permissões podem ser ativadas/desativadas
- Personal visualiza academias com acesso
- Academia visualiza personals autorizados

**Cenário de Uso:**
```
Personal João (Academia A) ajuda Academia B temporariamente
→ Academia B concede permissão a João
→ João edita dietas de TODOS clientes da Academia B
```

#### Tipo 2: Cliente → Personal/Academia Específica

**Tabela:** `user_permissions`

**Estrutura:**
```typescript
{
  id: number
  user_id: number              // Cliente que concede
  grantee_type: 'gym' | 'personal'
  grantee_id: number           // ID da academia ou personal
  can_edit_diets: boolean
  can_edit_trainings: boolean
  is_active: boolean
}
```

**Critérios de Aceitação:**
- Cliente pode autorizar personal específico
- Cliente pode autorizar academia específica
- Permissões granulares (dieta, treino)
- Acesso limitado apenas ao recurso do cliente
- Permissões podem ser revogadas

**Cenários de Uso:**

**Cenário 1:** Personal de outra academia
```
Maria (Academia A) quer Personal Pedro (Academia B)
→ Maria concede permissão a Pedro
→ Pedro edita apenas dieta/treino de Maria
```

**Cenário 2:** Academia temporária (viagem)
```
Lucas viaja e treina temporariamente na Academia Z
→ Lucas concede permissão à Academia Z
→ Todos personals da Academia Z podem editar dieta/treino de Lucas
```

---

### RF08 - Sistema de Planos e Assinaturas
**Prioridade:** 🟠 MÉDIA-ALTA

**Descrição:** Sistema de monetização com planos de assinatura que limitam recursos da academia (principalmente quantidade de usuários).

#### Planos Disponíveis

**Plano Inicial (Free):**
```typescript
{
  name: "Plano Inicial",
  slug: "initial",
  price: 0.00,
  max_users: 25,
  features: {
    user_limit: 25,
    trainings: true,
    diets: true,
    products: true
  }
}
```

**Plano Intermediário:**
```typescript
{
  name: "Plano Intermediário",
  slug: "intermediate",
  price: 50.00,
  max_users: 100,
  features: {
    user_limit: 100,
    trainings: true,
    diets: true,
    products: true
  }
}
```

**Plano Ilimitado:**
```typescript
{
  name: "Plano Ilimitado",
  slug: "unlimited",
  price: 100.00,
  max_users: null, // ilimitado
  features: {
    unlimited_users: true,
    trainings: true,
    diets: true,
    products: true,
    priority_support: true
  }
}
```

#### Estrutura de Dados

**Tabela:** `gym_plans`
```typescript
{
  id: number
  name: string
  slug: string // 'initial' | 'intermediate' | 'unlimited'
  price: decimal(10,2)
  max_users: number | null
  features: json
  is_active: boolean
}
```

**Tabela:** `gym_subscriptions`
```typescript
{
  id: number
  gym_id: number (FK)
  plan_id: number (FK)
  status: string // 'active' | 'cancelled' | 'past_due'
  payment_method: string // 'free' | 'google_pay' | 'apple_pay'
  payment_provider: string | null
  payment_provider_id: string | null
  payment_metadata: json | null
  started_at: datetime
  ends_at: datetime | null
  cancelled_at: datetime | null
}
```

#### Critérios de Aceitação

**Gestão de Planos:**
- Endpoint público para listar planos: `GET /gym-plans`
- Endpoint público para detalhes do plano: `GET /gym-plans/:id`
- Planos gerenciáveis apenas por Super Users via banco/seeders

**Assinaturas:**
- Toda academia recebe plano inicial (gratuito) na criação
- Endpoint para visualizar assinatura atual: `GET /gym-subscriptions` (autenticado)
- Endpoint para criar/trocar plano: `POST /gym-subscriptions` (admin/super)
- Endpoint para cancelar assinatura: `DELETE /gym-subscriptions` (admin/super)

**Validações:**
- Plano gratuito só aceita `payment_method: 'free'`
- Planos pagos não aceitam `payment_method: 'free'`
- Validação de limite de usuários antes de criar novo usuário
- Se academia atingir limite, retornar erro 403 ao tentar criar usuário

**Provedores de Pagamento:**
- **FreePlanStrategy**: Sempre disponível, sem validação
- **GooglePayStrategy**: Requer `payment_data.token` (mock em dev)
- **ApplePayStrategy**: Requer `payment_data.payment_token` (mock em dev)
- Extensível via Strategy + Registry Pattern

**Limites de Recursos:**
- Validação de limite de usuários via `PlanLimitService`
- `canAddUser(gym_id)` verifica se academia pode criar mais usuários
- Plano ilimitado (`max_users: null`) nunca bloqueia

**Transações:**
- Criação/troca de assinatura protegida por `db.transaction()`
- Cancelamento com refund (para planos pagos) em transação

**Histórico:**
- Assinatura anterior cancelada automaticamente ao criar nova
- Status alterado para `cancelled` com `cancelled_at` preenchido

#### Arquitetura

```
PaymentService (orchestrator)
  ↓
PaymentFactory (registry)
  ↓
PaymentStrategy (interface)
  ├── FreePlanStrategy
  ├── GooglePayStrategy
  └── ApplePayStrategy
```

**Padrões de Design:**
- **Strategy Pattern**: Cada provedor implementa `PaymentStrategy`
- **Registry Pattern**: `PaymentFactory` gerencia estratégias
- **Type Safety**: Constantes em `app/types/subscription_types.ts`

#### Cenários de Uso

**Cenário 1:** Nova academia criada
```
1. Sistema cria academia no banco
2. PaymentService.subscribe(gym, 'initial', 'free')
3. GymSubscription criada com status 'active'
4. Academia pode criar até 25 usuários
```

**Cenário 2:** Upgrade para plano pago
```
1. Admin acessa POST /gym-subscriptions
2. Envia: {plan_slug: 'intermediate', payment_method: 'google_pay', payment_data: {token: '...'}}
3. Sistema valida combinação plano/método
4. PaymentService cancela assinatura atual
5. GooglePayStrategy processa pagamento
6. Nova assinatura criada com status 'active'
7. Academia agora pode ter até 100 usuários
```

**Cenário 3:** Tentativa de criar usuário além do limite
```
1. Academia com plano inicial (25 usuários) já tem 25 usuários
2. Admin tenta criar 26º usuário: POST /users
3. PlanLimitService.canAddUser(gym_id) → false
4. Sistema retorna: 403 Forbidden {"error": "Limite de usuários atingido"}
```

**Cenário 4:** Cancelamento de assinatura
```
1. Admin acessa DELETE /gym-subscriptions
2. PaymentService.cancel(gym)
3. Se plano pago: GooglePayStrategy.refund(subscription_id)
4. Assinatura marcada como 'cancelled' com data de cancelamento
```

#### TODOs e Limitações

**Implementado:**
- ✅ Models: GymPlan, GymSubscription com helpers
- ✅ Migrations: Tabelas criadas e versionadas
- ✅ Seeders: 3 planos iniciais
- ✅ Services: PaymentService, PlanLimitService
- ✅ Strategy Pattern: 3 providers implementados
- ✅ Controllers: GymPlansController, GymSubscriptionsController
- ✅ Validators: Validação de entrada completa
- ✅ Policies: Autorização implementada
- ✅ Routes: Endpoints configurados
- ✅ Type Safety: Constantes tipadas
- ✅ Transactions: Operações críticas protegidas

**Pendente:**
- 🚧 Integração real Google Pay (atualmente mock)
- 🚧 Integração real Apple Pay (atualmente mock)
- ❌ Renovação automática mensal (cron job)
- ❌ Webhooks de pagamento (notificação de falhas)
- ❌ Notificações (email quando pagamento falhar)
- ❌ Histórico de assinaturas (manter registro de todas)
- ❌ Testes automatizados end-to-end
- ❌ Planos anuais com desconto
- ❌ Trial periods (período gratuito)
- ❌ Cupons de desconto

**Documentação:**
- 📄 Documentação detalhada em [docs/PAYMENT_SYSTEM.md](./PAYMENT_SYSTEM.md)

---

## 4. Requisitos Não Funcionais

### RNF01 - Segurança
**Prioridade:** 🔴 CRÍTICA

- Senhas criptografadas com Scrypt (hash seguro)
- Autenticação via Bearer Token
- Tokens com expiração configurável
- Proteção contra SQL Injection (Lucid ORM)
- Validação rigorosa de inputs
- CORS configurado adequadamente
- Logs de acesso (audit trail)

### RNF02 - Performance
**Prioridade:** 🟡 MÉDIA

- API responde em < 200ms (95% requisições)
- Queries otimizadas com índices
- Eager loading para evitar N+1
- Paginação em listagens
- Connection pooling no MySQL

### RNF03 - Isolamento Multi-Tenant
**Prioridade:** 🔴 CRÍTICA

- Queries SEMPRE filtram por `gym_id`
- Impossível acessar dados de outra academia sem permissão
- Validação em policies (double-check)
- Cascade delete em academia
- Testes de isolamento

### RNF04 - Escalabilidade
**Prioridade:** 🟢 BAIXA (curto prazo)

- Arquitetura preparada para horizontal scaling
- Stateless (tokens no banco)
- Separação de concerns (Services)
- Database sharding (futuro)

### RNF05 - Disponibilidade
**Prioridade:** 🟡 MÉDIA

- Uptime mínimo: 99.5%
- Logs estruturados
- Health check endpoint
- Graceful shutdown

### RNF06 - Manutenibilidade
**Prioridade:** 🟡 MÉDIA

- TypeScript com tipagem forte
- ESLint + Prettier
- Documentação inline
- Migrations versionadas
- Testes automatizados (cobertura > 80%)
- Code review obrigatório

---

## 5. Regras de Negócio

### RN01 - Isolamento de Academia
- Usuário pertence a UMA academia
- Não pode trocar de academia (apenas criar novo usuário)
- Dados isolados: queries filtram por `gym_id`

### RN02 - Hierarquia de Permissões
- Super > Admin > Personal > Cliente
- Super pode tudo em todas academias
- Admin gerencia sua academia
- Personal não edita Admin/Personal
- Cliente não edita nada (exceto próprio perfil)
- Usuários precisam ser aprovados para fazer login (exceto Super)

### RN03 - Criação de Recursos
- Dieta/Treino sempre vinculado à academia do criador
- Novo usuário sempre vinculado à academia do criador
- Produto sempre vinculado à academia

### RN04 - Permissões Cross-Tenant
- Apenas Personal pode receber permissões de academia
- Cliente pode conceder a Personal ou Academia
- Permissões são granulares (dieta E/OU treino)
- Permissões podem ser desativadas (não deletadas)

### RN05 - Atribuição de Dieta/Treino
- Um cliente pode ter apenas UMA dieta ativa
- Um cliente pode ter VÁRIOS treinos ativos
- Personal é registrado como "coach" do treino
- Dieta pode ser reutilizada (múltiplos clientes)

### RN06 - Exercícios no Treino
- Exercícios são cadastrados globalmente (reutilizáveis)
- Cada treino personaliza exercícios (séries, peso, descanso)
- Personalização armazenada na tabela pivot `training_exercise`

### RN07 - Soft Delete (Futuro)
- Academias não são deletadas fisicamente
- Usuários marcados como `published: false`
- Manutenção de histórico

---

## 6. Tecnologias e Ferramentas

### Stack Principal
- **Runtime:** Node.js 20.x
- **Framework:** AdonisJS v6
- **Linguagem:** TypeScript
- **Banco:** MySQL 8.0
- **ORM:** Lucid

### Autenticação & Autorização
- **@adonisjs/auth** (Access Tokens)
- **@adonisjs/bouncer** (Policies)

### Qualidade
- **ESLint** - Linting
- **Prettier** - Formatação
- **TypeScript** - Type checking

---

## 7. Estrutura de Dados

### Tabelas Principais

1. **gyms** - Academias (tenant)
2. **users** - Usuários (4 tipos: super, admin, personal, user)
3. **diets** - Dietas
4. **meals** - Refeições (dentro da dieta)
5. **foods** - Alimentos (dentro da refeição)
6. **trainings** - Treinos
7. **exercises** - Exercícios (reutilizáveis)
8. **training_exercise** - Pivot (treino-exercício com personalizações)
9. **products** - Produtos da academia
10. **gym_permissions** - Permissões academia-personal
11. **user_permissions** - Permissões cliente-específico
12. **auth_access_tokens** - Tokens de autenticação

### Índices Necessários

- `users.gym_id` - Filtragem por academia
- `users.email` - Login (unique)
- `users.cpf` - Validação (unique)
- `diets.gym_id` - Filtragem por academia
- `trainings.gym_id` - Filtragem por academia
- `trainings.user_id` - Treinos do cliente
- `trainings.coach_id` - Treinos do coach
- `products.gym_id` - Filtragem por academia
- `gym_permissions(gym_id, personal_id)` - Lookup rápido
- `user_permissions(user_id, grantee_type, grantee_id)` - Lookup rápido

---

## 8. Casos de Uso Principais

### UC01 - Registrar e Fazer Login
**Ator:** Usuário (qualquer tipo)  
**Fluxo:**
1. Usuário acessa endpoint de registro
2. Sistema valida dados
3. Sistema cria usuário vinculado a academia
4. Usuário faz login com email/senha
5. Sistema retorna access token
6. Usuário usa token em requisições subsequentes

### UC02 - Personal Cria Dieta para Cliente
**Ator:** Personal/Admin  
**Pré-condição:** Autenticado como Personal  
**Fluxo:**
1. Personal cria dieta (nome, descrição)
2. Personal adiciona refeições (café, almoço, etc)
3. Personal adiciona alimentos em cada refeição
4. Personal atribui dieta a cliente (user.diet_id)
5. Cliente visualiza sua dieta

### UC03 - Personal Cria Treino para Cliente
**Ator:** Personal/Admin  
**Fluxo:**
1. Personal cria treino (nome, descrição, user_id, coach_id)
2. Personal seleciona exercícios existentes
3. Personal personaliza cada exercício (séries, peso, descanso)
4. Sistema salva treino
5. Cliente visualiza seu treino

### UC04 - Academia Autoriza Personal Externo
**Ator:** Admin (da academia)  
**Fluxo:**
1. Admin acessa permissões de academia
2. Admin seleciona personal de outra academia
3. Admin concede permissões (dietas, treinos)
4. Personal externo acessa recursos DA academia
5. Personal edita dietas/treinos de clientes DA academia

### UC05 - Cliente Autoriza Personal Externo
**Ator:** Cliente  
**Fluxo:**
1. Cliente acessa suas permissões
2. Cliente seleciona personal específico
3. Cliente concede permissão (dieta E/OU treino)
4. Personal visualiza e edita apenas recursos DESSE cliente
5. Cliente pode revogar permissão

---

## 9. Métricas de Sucesso

### Técnicas
- [ ] Cobertura de testes > 80%
- [ ] 0 vulnerabilidades críticas
- [ ] Tempo de resposta < 200ms (95%)
- [ ] Uptime > 99.5%
- [ ] 0 bugs críticos em produção

### Funcionais
- [ ] Isolamento 100% entre academias
- [ ] Autenticação funcionando corretamente
- [ ] Autorização respeitando todas as regras
- [ ] Permissões cross-tenant operacionais
- [ ] CRUD completo de todos recursos

---

## 10. Próximos Passos (Roadmap)

### Sprint 1 - Controllers e Rotas ✅ (CONCLUÍDA)
- [x] AuthController (register, login, logout)
- [x] UserController (CRUD)
- [x] Rotas REST completas
- [x] Validators de entrada
- [x] Padronização snake_case em todos os campos do banco

### Sprint 2 - Recursos Principais ✅ (CONCLUÍDA)
- [x] DietController (CRUD)
- [x] MealController (CRUD)
- [x] FoodController (CRUD)
- [x] TrainingController (CRUD)
- [x] ExerciseController (CRUD)

### Sprint 3 - Permissões ✅ (CONCLUÍDA)
- [x] GymPermissionController
- [x] UserPermissionController
- [x] ProductController
- [x] GymController

### Sprint 4 - Qualidade ✅ (CONCLUÍDA)
- [x] Testes funcionais (auth, users, diets, trainings, products, permissions)
- [x] Documentação API (Swagger), Adonis tem suporte usando o adonis-autoswagger
- [x] Seeders

### Sprint 5 - Monitoramento e Segurança ✅ (CONCLUÍDA)
- [x] Monitoramento - Arquitetura desacoplada com suporte a Sentry (ou outros providers)
- [x] Rate limiting - Proteção contra brute force e abuso da API
- [x] Exception handler integrado com monitoramento
- [x] Documentação completa (docs/RATE_LIMITING.md, docs/ERROR_MONITORING.md)

### Sprint 6 - Finalização ✅ (CONCLUÍDA)
- [x] Executar os testes para validar tudo
- [x] Documentação adicional - Arquivo de deployment, instruções de produção e Fluxograma de como funciona o App
- [x] Melhorias - Otimizações, índices no banco (50+ índices implementados)
- [x] Build de produção e deploy (ecosystem.config.js, DEPLOYMENT.md, PRODUCTION.md)
- [x] Documentação de arquitetura (ARCHITECTURE.md com fluxogramas completos)
- [x] Documentação de otimizações (docs/OPTIMIZATIONS.md)
- [x] README.md atualizado e completo

### Sprint 7 - Reusabilidade ✅ (CONCLUÍDA)
- [x] Campo `is_reusable` adicionado nas tabelas `diets` e `trainings`
- [x] Rota `GET /diets/shared` - listagem de dietas reutilizáveis
- [x] Rota `POST /diets/:id/clone` - clonagem de dieta
- [x] Rota `GET /trainings/shared` - listagem de treinos reutilizáveis
- [x] Rota `POST /trainings/:id/clone` - clonagem de treino
- [x] Consolidação: migration `add_is_reusable` removida, campos migrados para criação das tabelas

### Sprint 8 - Planos e Pagamento ✅ (CONCLUÍDA)
- [x] Migrations: `gym_plans`, `gym_subscriptions`, relação com `gyms`
- [x] Models: GymPlan, GymSubscription com helper methods
- [x] Seeders: 3 planos (Initial, Intermediate, Unlimited)
- [x] Services: PaymentService (subscribe, cancel, change)
- [x] Services: PlanLimitService (validação de limites)
- [x] Strategy Pattern: PaymentStrategy interface + PaymentFactory
- [x] Providers: FreePlanStrategy, GooglePayStrategy, ApplePayStrategy
- [x] Controllers: GymPlansController (público), GymSubscriptionsController (autenticado)
- [x] Validators: GymSubscriptionValidator com validação de combinação plano/método
- [x] Policies: SubscriptionPolicy (autorização admin/super)
- [x] Routes: `/gym-plans` (público), `/gym-subscriptions` (autenticado)
- [x] Type Safety: Constantes em `subscription_types.ts` (PLAN_SLUGS, SUBSCRIPTION_STATUS, PAYMENT_METHODS)
- [x] Refactoring: Unificação de métodos, transações atômicas, DRY principles
- [x] Integração: Assinatura automática ao criar academia
- [x] Validação: Limite de usuários aplicado em UsersController
- [x] Documentação: docs/PAYMENT_SYSTEM.md completo

---

## 11. Glossário

- **Tenant:** Academia (isolamento lógico de dados)
- **Cross-Tenant:** Acesso entre academias diferentes
- **Personal/Coach:** Profissional que cria treinos/dietas
- **Cliente:** Usuário final que treina na academia
- **Admin:** Administrador da academia com controle total
- **Pivot Table:** Tabela intermediária em relação N:N
- **Policy:** Regra de autorização no Bouncer
- **Ability:** Verificação de permissão simples
- **Bearer Token:** Token de autenticação via header HTTP
- **Eager Loading:** Carregar relacionamentos antecipadamente
- **N+1 Query:** Problema de performance com queries múltiplas

---

**Documento elaborado em:** 16/02/2026  
**Última atualização:** 17/02/2026  
**Versão:** 1.1  
**Status:** 📝 Em implementação
