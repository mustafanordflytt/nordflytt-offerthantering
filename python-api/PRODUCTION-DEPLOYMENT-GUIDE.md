# 🚀 PRODUCTION DEPLOYMENT GUIDE
## Nordflytt GPT RAG API → api.nordflytt.se

### 📋 FÖRBEREDELSER

#### 1. **Server Requirements**
- Ubuntu 20.04+ eller Debian 11+
- Minst 2GB RAM, 2 vCPUs
- 20GB SSD lagring
- Port 80 och 443 öppna

#### 2. **DNS Configuration**
Skapa A-record för `api.nordflytt.se` som pekar på din server IP:
```
Type: A
Name: api
Value: [DIN-SERVER-IP]
TTL: 300
```

### 🔧 STEG-FÖR-STEG DEPLOYMENT

#### Steg 1: **Logga in på servern**
```bash
ssh root@[DIN-SERVER-IP]
```

#### Steg 2: **Installera Docker**
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

#### Steg 3: **Klona projektet**
```bash
# Skapa app directory
mkdir -p /opt/nordflytt
cd /opt/nordflytt

# Kopiera python-api mappen till servern
# (använd scp, rsync eller git)
```

#### Steg 4: **Konfigurera environment**
```bash
cd /opt/nordflytt/python-api

# Skapa production env fil
cp .env.production .env

# Editera med dina värden
nano .env
```

**VIKTIGT: Uppdatera dessa värden:**
```env
SUPABASE_SERVICE_ROLE_KEY=din-riktiga-service-role-key
NORDFLYTT_GPT_API_KEY=generera-säker-api-nyckel-här
```

#### Steg 5: **Generera SSL-certifikat**
```bash
# Installera Certbot
apt install certbot -y

# Stoppa alla tjänster på port 80
systemctl stop nginx apache2 2>/dev/null || true

# Generera certifikat
certbot certonly --standalone -d api.nordflytt.se \
  --non-interactive --agree-tos \
  --email admin@nordflytt.se \
  --rsa-key-size 4096
```

#### Steg 6: **Kör deployment script**
```bash
cd /opt/nordflytt/python-api
chmod +x deploy.sh
./deploy.sh
```

#### Steg 7: **Verifiera deployment**
```bash
# Check service status
docker-compose ps

# Check logs
docker-compose logs -f gpt-api

# Test health endpoint
curl https://api.nordflytt.se/health
```

### 📊 DATABASE MIGRATIONS

Kör dessa i Supabase SQL Editor:

1. Logga in på [Supabase Dashboard](https://app.supabase.com)
2. Välj ditt projekt
3. Gå till SQL Editor
4. Kör varje migration fil i ordning:
   - `001_create_support_tickets.sql`
   - `002_create_gpt_analytics.sql`
   - `003_update_existing_tables.sql`

### 🔐 SÄKERHET

#### 1. **Generera säker API-nyckel**
```bash
# Generera 32-character random key
openssl rand -base64 32
```

#### 2. **Konfigurera firewall**
```bash
# Om du använder UFW
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

#### 3. **Säkra Docker**
```bash
# Lägg till i /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### 🧪 TESTA PRODUCTION API

#### 1. **Från servern:**
```bash
cd /opt/nordflytt/python-api
python3 test_api.py
```

#### 2. **Från din dator:**
```bash
# Customer lookup
curl -X POST https://api.nordflytt.se/gpt-rag/customer-lookup \
  -H "Authorization: Bearer DIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 🔧 CUSTOM GPT KONFIGURATION

#### 1. **Uppdatera OpenAI Custom GPT:**
- Gå till [OpenAI GPT Editor](https://chat.openai.com/gpts/editor)
- Välj "Maja från Nordflytt"
- Uppdatera Actions:

```yaml
servers:
  - url: https://api.nordflytt.se
```

#### 2. **Uppdatera Authentication:**
- API Key: `[DIN PRODUCTION API KEY]`

#### 3. **Testa integration:**
Fråga GPT:n: "Kan du slå upp anna.svensson@gmail.com?"

### 📈 MONITORING

#### 1. **Visa loggar**
```bash
# All logs
docker-compose logs -f

# Only API logs
docker-compose logs -f gpt-api

# Only nginx logs
docker-compose logs -f nginx
```

#### 2. **Monitor resurser**
```bash
# Docker stats
docker stats

# System resources
htop
```

#### 3. **Check API metrics**
```sql
-- I Supabase SQL Editor
SELECT * FROM gpt_api_metrics 
ORDER BY timestamp DESC 
LIMIT 100;
```

### 🚨 TROUBLESHOOTING

#### Problem: "Connection refused"
```bash
# Check if services are running
docker-compose ps

# Restart services
docker-compose restart
```

#### Problem: "502 Bad Gateway"
```bash
# Check API logs
docker-compose logs gpt-api

# Restart API
docker-compose restart gpt-api
```

#### Problem: "SSL certificate error"
```bash
# Renew certificate
certbot renew --force-renewal

# Restart nginx
docker-compose restart nginx
```

### 🔄 UPPDATERINGAR

#### Deploy ny version:
```bash
cd /opt/nordflytt/python-api

# Pull latest code
git pull  # eller kopiera nya filer

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

### 📞 SUPPORT CHECKLIST

Om något går fel, kontrollera:
1. ✅ DNS pekar på rätt IP?
2. ✅ Portar 80/443 öppna?
3. ✅ SSL-certifikat giltigt?
4. ✅ Environment variabler konfigurerade?
5. ✅ Database migrations körda?
6. ✅ Docker containers körs?
7. ✅ API key i Custom GPT uppdaterad?

### 🎉 FÄRDIG!

När allt är klart ska du ha:
- ✅ API live på https://api.nordflytt.se
- ✅ SSL/HTTPS fungerar
- ✅ Custom GPT ansluten
- ✅ Monitoring aktivt
- ✅ "Maja från Nordflytt" kan svara med real CRM-data!

---

**Production deployment av Claude Code**  
**Status: READY FOR DEPLOYMENT** 🚀