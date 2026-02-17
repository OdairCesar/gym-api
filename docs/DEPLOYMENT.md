# 🚀 Guia de Deploy - Gym API

Guia completo para deploy da aplicação em produção.

---

## 📋 Pré-requisitos

### Servidor

- **Node.js:** v20.x ou superior
- **MySQL:** v8.0 ou superior
- **RAM:** Mínimo 512MB (recomendado 1GB+)
- **Disco:** Mínimo 500MB

### Serviços Externos (Opcional)

- **Sentry:** Para monitoramento de erros (ou outro provider)
- **Redis:** Para cache (futuro)

---

## 🔧 Configuração Inicial

### 1. Clonar Repositório

```bash
git clone <repository-url>
cd gym-api-adonis
```

### 2. Instalar Dependências

```bash
npm ci --omit=dev
```

> **Nota:** Use `npm ci` ao invés de `npm install` para garantir versões exatas do `package-lock.json`.

### 3. Configurar Variáveis de Ambiente

Crie o arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Edite o `.env` com as configurações de produção:

```env
# Ambiente
NODE_ENV=production
PORT=3333
HOST=0.0.0.0
LOG_LEVEL=info

# Chave da aplicação (CRÍTICO: gerar nova chave!)
APP_KEY=<gerar-chave-segura>

# Banco de Dados
DB_HOST=<ip-do-banco>
DB_PORT=3306
DB_USER=<usuario>
DB_PASSWORD=<senha-forte>
DB_DATABASE=gym_api_production

# Rate Limiting (usar database em produção)
LIMITER_STORE=database

# Error Monitoring (opcional mas recomendado)
ERROR_MONITORING_PROVIDER=sentry
SENTRY_DSN=https://...@sentry.io/...
```

### 4. Gerar APP_KEY

```bash
node ace generate:key
```

Copie a chave gerada e adicione ao `.env`:

```env
APP_KEY=<chave-gerada>
```

---

## 🗄️ Configuração do Banco de Dados

### 1. Criar Banco de Dados

```sql
CREATE DATABASE gym_api_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'gym_api_user'@'%' IDENTIFIED BY '<senha-forte>';
GRANT ALL PRIVILEGES ON gym_api_production.* TO 'gym_api_user'@'%';
FLUSH PRIVILEGES;
```

### 2. Executar Migrations

```bash
node ace migration:run --force
```

> **Nota:** O flag `--force` é necessário em produção.

### 3. Popular Banco (Seeders) - Opcional

⚠️ **ATENÇÃO:** Seeders criam dados de exemplo. **NÃO execute em produção real!**

```bash
# Apenas para staging/desenvolvimento
node ace db:seed
```

---

## 🏗️ Build da Aplicação

### 1. Build Local (antes de enviar ao servidor)

```bash
npm run build
```

Isso gera a pasta `build/` com o código compilado.

### 2. Enviar Build ao Servidor

**Opção A: Usando Git**
```bash
git push origin main
# No servidor
git pull origin main
npm ci --omit=dev
node ace build
```

**Opção B: Usando SCP/RSYNC**
```bash
# Build localmente
npm run build

# Enviar build ao servidor
rsync -avz --exclude node_modules --exclude .env ./build/ user@server:/var/www/gym-api/
```

**Opção C: CI/CD (Recomendado)**
- GitHub Actions
- GitLab CI
- Jenkins
- Etc.

---

## 🚀 Iniciar Aplicação

### Opção 1: Direto com Node

```bash
cd build
node bin/server.js
```

### Opção 2: PM2 (Recomendado)

PM2 gerencia o processo, reinicia automaticamente e fornece logs.

#### Instalar PM2

```bash
npm install -g pm2
```

#### Criar Arquivo de Configuração

Crie `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'gym-api',
    script: './build/bin/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3333,
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
  }]
}
```

#### Iniciar com PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Comandos PM2 Úteis

```bash
pm2 status              # Ver status
pm2 logs gym-api        # Ver logs
pm2 restart gym-api     # Reiniciar
pm2 stop gym-api        # Parar
pm2 delete gym-api      # Remover
pm2 monit               # Monitor em tempo real
```

### Opção 3: Systemd (Linux)

Crie `/etc/systemd/system/gym-api.service`:

```ini
[Unit]
Description=Gym API
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/gym-api/build
ExecStart=/usr/bin/node bin/server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Ativar e iniciar:

```bash
sudo systemctl enable gym-api
sudo systemctl start gym-api
sudo systemctl status gym-api
```

---

## 🔐 Nginx Reverse Proxy

### Configuração Nginx

Crie `/etc/nginx/sites-available/gym-api`:

```nginx
server {
    listen 80;
    server_name api.seu-dominio.com;

    # Logs
    access_log /var/log/nginx/gym-api-access.log;
    error_log /var/log/nginx/gym-api-error.log;

    # Rate Limiting no Nginx (adicional)
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;

    location / {
        limit_req zone=api_limit burst=50 nodelay;

        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Ativar:

```bash
sudo ln -s /etc/nginx/sites-available/gym-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL com Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.seu-dominio.com
```

---

## 📊 Monitoramento

### 1. Logs da Aplicação

```bash
# PM2
pm2 logs gym-api

# Systemd
sudo journalctl -u gym-api -f

# Arquivos de log
tail -f logs/app.log
```

### 2. Sentry (Error Monitoring)

Configure o DSN no `.env`:

```env
ERROR_MONITORING_PROVIDER=sentry
SENTRY_DSN=https://...@sentry.io/...
```

Acesse o dashboard do Sentry para ver erros em tempo real.

### 3. Métricas do Sistema

```bash
# CPU e Memória
pm2 monit

# Conexões de rede
netstat -an | grep :3333

# Banco de dados
mysql -u root -p -e "SHOW PROCESSLIST;"
```

---

## 🔄 Atualizações

### Deploy de Nova Versão

```bash
# 1. Pull do código
git pull origin main

# 2. Instalar dependências
npm ci --omit=dev

# 3. Build
npm run build

# 4. Executar migrations
node ace migration:run --force

# 5. Reiniciar aplicação
pm2 restart gym-api

# 6. Verificar status
pm2 status
pm2 logs gym-api --lines 50
```

### Rollback

```bash
# 1. Reverter código
git checkout <commit-anterior>

# 2. Build
npm run build

# 3. Rollback migrations (se necessário)
node ace migration:rollback --force --batch=1

# 4. Reiniciar
pm2 restart gym-api
```

---

## 🛡️ Segurança

### Checklist de Segurança

- [ ] Gerar novo `APP_KEY` único para produção
- [ ] Usar senhas fortes no banco de dados
- [ ] Configurar firewall (liberar apenas portas necessárias)
- [ ] Usar HTTPS (SSL/TLS)
- [ ] Configurar CORS adequadamente
- [ ] Manter dependências atualizadas
- [ ] Fazer backup regular do banco
- [ ] Limitar acesso SSH
- [ ] Usar variáveis de ambiente para credenciais
- [ ] Configurar rate limiting

### Firewall (UFW)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3306/tcp from <ip-aplicacao>  # MySQL (apenas para app)
sudo ufw enable
```

---

## 💾 Backup

### Backup do Banco de Dados

```bash
# Backup manual
mysqldump -u gym_api_user -p gym_api_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup automático (cron)
# Adicionar ao crontab: crontab -e
0 2 * * * mysqldump -u gym_api_user -p<senha> gym_api_production | gzip > /backups/gym_api_$(date +\%Y\%m\%d).sql.gz
```

### Backup de Arquivos

```bash
# Backup do .env e configurações
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env ecosystem.config.js
```

---

## 🐛 Troubleshooting

### Aplicação não inicia

1. Verificar logs: `pm2 logs gym-api`
2. Verificar se o banco está acessível: `mysql -h <host> -u <user> -p`
3. Verificar variáveis de ambiente: `cat .env`
4. Verificar porta em uso: `netstat -an | grep :3333`

### Erros de conexão com banco

1. Verificar credenciais no `.env`
2. Testar conexão: `mysql -h <host> -u <user> -p`
3. Verificar firewall: `sudo ufw status`
4. Verificar se o MySQL está rodando: `sudo systemctl status mysql`

### Performance degradada

1. Verificar uso de CPU/RAM: `pm2 monit`
2. Verificar logs de erro: `pm2 logs gym-api --err`
3. Verificar queries lentas no MySQL: `SHOW FULL PROCESSLIST;`
4. Verificar rate limiting: `SELECT * FROM rate_limits;`

### Rate Limit bloqueando usuários legítimos

1. Ajustar limites em `start/limiter.ts`
2. Limpar rate limits: `DELETE FROM rate_limits WHERE key = '<chave>';`
3. Rebuild e restart: `npm run build && pm2 restart gym-api`

---

## 📚 Recursos Adicionais

- [AdonisJS Deployment Guide](https://docs.adonisjs.com/guides/deployment)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)

---

## 🎯 Ambientes

### Desenvolvimento
```env
NODE_ENV=development
LOG_LEVEL=debug
ERROR_MONITORING_PROVIDER=none
```

### Staging
```env
NODE_ENV=production
LOG_LEVEL=info
ERROR_MONITORING_PROVIDER=sentry
```

### Produção
```env
NODE_ENV=production
LOG_LEVEL=warn
ERROR_MONITORING_PROVIDER=sentry
```

---

**Última atualização:** 16/02/2026  
**Versão:** 1.0
