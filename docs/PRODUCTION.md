# 📖 Manual de Produção - Gym API

Guia de operação e manutenção da aplicação em ambiente de produção.

---

## 🚦 Status da Aplicação

### Verificar Status

```bash
# PM2
pm2 status
pm2 info gym-api

# Systemd
sudo systemctl status gym-api

# Health Check
curl http://localhost:3333/
```

**Resposta esperada:**
```json
{
  "app": "Gym API",
  "version": "1.0.0",
  "status": "ok"
}
```

---

## 📊 Monitoramento

### 1. Logs em Tempo Real

```bash
# Ver logs da aplicação
pm2 logs gym-api

# Ver apenas erros
pm2 logs gym-api --err

# Ver últimas 100 linhas
pm2 logs gym-api --lines 100

# Logs do Nginx
sudo tail -f /var/log/nginx/gym-api-access.log
sudo tail -f /var/log/nginx/gym-api-error.log
```

### 2. Métricas do Sistema

```bash
# Monitor PM2 interativo
pm2 monit

# Informações detalhadas
pm2 show gym-api

# Uso de recursos
htop
free -h
df -h
```

### 3. Banco de Dados

```bash
# Conexões ativas
mysql -u root -p -e "SHOW PROCESSLIST;"

# Queries lentas
mysql -u root -p -e "SELECT * FROM information_schema.processlist WHERE time > 5;"

# Tamanho do banco
mysql -u root -p -e "SELECT table_schema AS 'Database', 
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' 
  FROM information_schema.tables 
  WHERE table_schema = 'gym_api_production' 
  GROUP BY table_schema;"
```

### 4. Rate Limiting

```bash
# Ver rate limits ativos
mysql -u gym_api_user -p gym_api_production -e "
  SELECT key, points, expire_at 
  FROM rate_limits 
  WHERE expire_at > NOW() 
  ORDER BY points DESC 
  LIMIT 20;
"

# Limpar rate limits de um IP específico
mysql -u gym_api_user -p gym_api_production -e "
  DELETE FROM rate_limits WHERE key LIKE '%192.168.1.100%';
"
```

---

## 🔄 Operações Comuns

### Reiniciar Aplicação

```bash
# Reinício graceful (recomendado)
pm2 reload gym-api

# Reinício imediato
pm2 restart gym-api

# Reiniciar todos os processos
pm2 restart all
```

### Parar/Iniciar Aplicação

```bash
# Parar
pm2 stop gym-api

# Iniciar
pm2 start ecosystem.config.js

# Remover do PM2
pm2 delete gym-api
```

### Atualizar Aplicação

```bash
# 1. Fazer backup do banco
mysqldump -u gym_api_user -p gym_api_production > backup_pre_update_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull do código
cd /var/www/gym-api
git pull origin main

# 3. Instalar dependências
npm ci --omit=dev

# 4. Build
npm run build

# 5. Executar migrations
node ace migration:run --force

# 6. Reload aplicação
pm2 reload gym-api

# 7. Verificar logs
pm2 logs gym-api --lines 50
```

---

## 🗄️ Manutenção do Banco de Dados

### Backup Manual

```bash
# Backup completo
mysqldump -u gym_api_user -p gym_api_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup compactado
mysqldump -u gym_api_user -p gym_api_production | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup apenas estrutura (sem dados)
mysqldump -u gym_api_user -p --no-data gym_api_production > schema_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar Backup

```bash
# Restaurar de backup
mysql -u gym_api_user -p gym_api_production < backup_20260216_143022.sql

# Restaurar de backup compactado
gunzip < backup_20260216_143022.sql.gz | mysql -u gym_api_user -p gym_api_production
```

### Backup Automático

Adicione ao crontab (`crontab -e`):

```cron
# Backup diário às 2h da manhã
0 2 * * * /usr/bin/mysqldump -u gym_api_user -p<senha> gym_api_production | gzip > /backups/gym_api_$(date +\%Y\%m\%d).sql.gz

# Limpar backups antigos (manter últimos 30 dias)
0 3 * * * find /backups -name "gym_api_*.sql.gz" -mtime +30 -delete
```

### Otimizar Tabelas

```bash
# Otimizar todas as tabelas
mysql -u root -p -e "
  USE gym_api_production;
  OPTIMIZE TABLE users, gyms, diets, trainings, products, exercises, meals, foods, 
    gympermissions, userpermissions, access_tokens, rate_limits;
"

# Analisar tabelas
mysql -u root -p -e "
  USE gym_api_production;
  ANALYZE TABLE users, gyms, diets, trainings;
"
```

---

## 🔍 Diagnóstico de Problemas

### Aplicação Não Responde

```bash
# 1. Verificar se o processo está rodando
pm2 status

# 2. Verificar logs de erro
pm2 logs gym-api --err --lines 50

# 3. Verificar porta em uso
netstat -tulpn | grep :3333

# 4. Verificar uso de recursos
pm2 monit

# 5. Reiniciar se necessário
pm2 restart gym-api
```

### Erros de Banco de Dados

```bash
# 1. Verificar se MySQL está rodando
sudo systemctl status mysql

# 2. Testar conexão
mysql -h <host> -u gym_api_user -p

# 3. Verificar conexões ativas
mysql -u root -p -e "SHOW PROCESSLIST;"

# 4. Verificar logs do MySQL
sudo tail -f /var/log/mysql/error.log

# 5. Reiniciar MySQL (cuidado!)
sudo systemctl restart mysql
```

### Performance Lenta

```bash
# 1. Ver queries lentas
mysql -u root -p -e "
  SELECT * FROM information_schema.processlist 
  WHERE command != 'Sleep' AND time > 2 
  ORDER BY time DESC;
"

# 2. Verificar uso de CPU/RAM
htop
pm2 monit

# 3. Verificar I/O do disco
iostat -x 1 5

# 4. Analisar logs de acesso
sudo tail -f /var/log/nginx/gym-api-access.log | grep -E 'POST|PUT|DELETE'
```

### Rate Limit Bloqueando Usuários

```bash
# 1. Verificar rate limits ativos
mysql -u gym_api_user -p gym_api_production -e "
  SELECT key, points, expire_at, TIMESTAMPDIFF(SECOND, NOW(), expire_at) as seconds_remaining
  FROM rate_limits 
  WHERE expire_at > NOW() 
  ORDER BY points DESC;
"

# 2. Limpar rate limit de IP específico
mysql -u gym_api_user -p gym_api_production -e "
  DELETE FROM rate_limits WHERE key LIKE '%<IP>%';
"

# 3. Limpar todos rate limits expirados
mysql -u gym_api_user -p gym_api_production -e "
  DELETE FROM rate_limits WHERE expire_at < NOW();
"
```

### Memória Alta

```bash
# 1. Verificar uso de memória
free -h
pm2 info gym-api

# 2. Restart se necessário (libera memória)
pm2 restart gym-api

# 3. Configurar limite de memória no PM2
# Editar ecosystem.config.js
max_memory_restart: '500M'

# 4. Aplicar configuração
pm2 reload ecosystem.config.js
```

---

## 📈 Análise de Performance

### Métricas HTTP

```bash
# Requisições por segundo
sudo tail -f /var/log/nginx/gym-api-access.log | pv -l -i1 -r > /dev/null

# Top 10 endpoints mais acessados
sudo awk '{print $7}' /var/log/nginx/gym-api-access.log | sort | uniq -c | sort -rn | head -10

# Status codes
sudo awk '{print $9}' /var/log/nginx/gym-api-access.log | sort | uniq -c | sort -rn
```

### Análise de Banco de Dados

```sql
-- Top 10 tabelas por tamanho
SELECT 
  table_name AS 'Table',
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'gym_api_production'
ORDER BY (data_length + index_length) DESC
LIMIT 10;

-- Número de registros por tabela
SELECT 
  table_name,
  table_rows
FROM information_schema.tables
WHERE table_schema = 'gym_api_production'
ORDER BY table_rows DESC;
```

---

## 🔐 Segurança

### Auditoria de Acessos

```bash
# Últimos logins
sudo tail -100 /var/log/auth.log | grep 'Accepted'

# Tentativas de login SSH falhadas
sudo tail -100 /var/log/auth.log | grep 'Failed password'

# IPs bloqueados pelo rate limiting
mysql -u gym_api_user -p gym_api_production -e "
  SELECT DISTINCT key, points 
  FROM rate_limits 
  WHERE points >= 5 
  ORDER BY points DESC;
"
```

### Atualizar Dependências

```bash
# Verificar vulnerabilidades
npm audit

# Corrigir automaticamente
npm audit fix

# Atualizar dependências menores
npm update

# Rebuild e restart
npm run build
pm2 restart gym-api
```

### Rotação de Secrets

```bash
# 1. Gerar novo APP_KEY
node ace generate:key

# 2. Atualizar .env com novo valor
nano .env

# 3. Reiniciar aplicação
pm2 restart gym-api

# 4. Invalidar tokens antigos (todos usuários precisarão fazer login)
mysql -u gym_api_user -p gym_api_production -e "TRUNCATE access_tokens;"
```

---

## 🧹 Manutenção Preventiva

### Limpeza de Dados Antigos

```sql
-- Limpar tokens expirados (rodar semanalmente)
DELETE FROM access_tokens 
WHERE expires_at < NOW();

-- Limpar rate limits expirados
DELETE FROM rate_limits 
WHERE expire_at < NOW();

-- Verificar antes de deletar
SELECT COUNT(*) FROM access_tokens WHERE expires_at < NOW();
SELECT COUNT(*) FROM rate_limits WHERE expire_at < NOW();
```

### Rotação de Logs

Configurar logrotate (`/etc/logrotate.d/gym-api`):

```
/var/www/gym-api/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Checklist Semanal

- [ ] Verificar espaço em disco: `df -h`
- [ ] Verificar uso de memória: `free -h`
- [ ] Verificar logs de erro: `pm2 logs gym-api --err --lines 50`
- [ ] Verificar erros no Sentry (se configurado)
- [ ] Backup do banco de dados
- [ ] Limpar dados antigos (tokens, rate limits)
- [ ] Verificar atualizações de segurança: `npm audit`

### Checklist Mensal

- [ ] Atualizar dependências: `npm update && npm run build`
- [ ] Otimizar tabelas do banco: `OPTIMIZE TABLE ...`
- [ ] Revisar logs do Nginx
- [ ] Verificar certificado SSL (renovação)
- [ ] Revisar métricas de performance
- [ ] Testar backup e restore

---

## 📞 Contatos de Emergência

### Escalação

1. **Nível 1:** Reiniciar aplicação
2. **Nível 2:** Rollback para versão anterior
3. **Nível 3:** Restaurar backup do banco
4. **Nível 4:** Contatar equipe de desenvolvimento

### Ferramentas de Comunicação

- **Alertas:** Configurar no Sentry ou PagerDuty
- **Status Page:** Criar página de status pública
- **Logs Centralizados:** Considerar ELK Stack ou similar

---

## 📚 Comandos Rápidos

```bash
# Status geral
pm2 status && systemctl status nginx && systemctl status mysql

# Restart completo
pm2 restart gym-api && sudo systemctl reload nginx

# Ver erros recentes
pm2 logs gym-api --err --lines 20

# Backup rápido
mysqldump -u gym_api_user -p gym_api_production | gzip > /tmp/backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Limpar cache/memória
pm2 flush
pm2 restart gym-api

# Verificar versão
cd /var/www/gym-api && git log -1 --oneline
```

---

## 🎯 SLAs e Métricas

### Objetivos

- **Uptime:** > 99.5%
- **Response Time:** < 500ms (p95)
- **Error Rate:** < 0.1%
- **Rate Limit False Positives:** < 1%

### Monitorar

- Configurar alertas no Sentry para spike de erros
- Configurar alertas de CPU/RAM no servidor
- Monitorar tempo de resposta do banco
- Verificar logs diariamente

---

**Última atualização:** 16/02/2026  
**Versão:** 1.0  
**Equipe:** DevOps / Backend
