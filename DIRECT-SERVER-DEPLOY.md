# 🚀 Direkt Server Deployment för api.nordflytt.se

## Snabbguide - Kopiera och kör dessa kommandon

### 1. På din lokala dator:
```bash
# Skapa deployment-paket
tar -czf nordflytt-api.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='*.log' \
  .

# Ladda upp till servern (byt ut user@server)
scp nordflytt-api.tar.gz user@api.nordflytt.se:/tmp/
```

### 2. SSH in på servern:
```bash
ssh user@api.nordflytt.se
```

### 3. På servern, kör dessa kommandon:
```bash
# Gå till web-katalogen
cd /var/www
sudo mkdir -p api.nordflytt.se
cd api.nordflytt.se

# Extrahera filer
sudo tar -xzf /tmp/nordflytt-api.tar.gz

# Installera Node.js 18 (om inte redan installerat)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installera PM2
sudo npm install -g pm2

# Installera dependencies
sudo npm install --production=false

# Skapa .env.production från din lokala kopia
sudo nano .env.production
# Klistra in innehållet från din lokala .env.production

# Bygg applikationen
sudo npm run build

# Starta med PM2
sudo pm2 start npm --name "nordflytt-api" -- start
sudo pm2 save
sudo pm2 startup
```

### 4. Konfigurera Nginx:
```bash
sudo nano /etc/nginx/sites-available/api.nordflytt.se
```

Klistra in:
```nginx
server {
    server_name api.nordflytt.se;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Aktivera site
sudo ln -s /etc/nginx/sites-available/api.nordflytt.se /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Installera SSL-certifikat
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.nordflytt.se
```

### 5. Testa att allt fungerar:
```bash
# På servern
curl http://localhost:3000/api/recruitment/candidate-info?id=1 \
  -H "Authorization: Bearer lowisa_nordflytt_2024_secretkey123"

# Från din lokala dator
curl https://api.nordflytt.se/api/recruitment/candidate-info?id=1 \
  -H "Authorization: Bearer lowisa_nordflytt_2024_secretkey123"
```

## ✅ Klart!

Din API ska nu vara tillgänglig på:
- https://api.nordflytt.se/api/recruitment/candidate-info
- https://api.nordflytt.se/api/recruitment/lowisa-webhook-simple
- https://api.nordflytt.se/api/recruitment/save-conversation

## 🔧 Felsökning

### Om PM2 kraschar:
```bash
pm2 logs nordflytt-api
pm2 restart nordflytt-api
```

### Om Nginx ger 502:
```bash
# Kontrollera att Node körs
pm2 status
# Kontrollera porten
sudo netstat -tlnp | grep 3000
```

### Uppdatera koden:
```bash
cd /var/www/api.nordflytt.se
git pull  # eller ladda upp ny tar.gz
npm install
npm run build
pm2 restart nordflytt-api
```