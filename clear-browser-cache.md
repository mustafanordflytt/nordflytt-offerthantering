# 🧹 RENSA BROWSER CACHE OCH SERVICE WORKERS

## Steg 1: Öppna Chrome DevTools
- Tryck **F12** eller **Cmd+Option+I** (Mac)

## Steg 2: Rensa Application Storage
1. Gå till **Application** tab
2. I vänstra sidofältet, klicka på **Storage**
3. Klicka på **Clear site data** knappen

## Steg 3: Rensa Service Workers
1. Under **Application** → **Service Workers**
2. Klicka **Unregister** på ALLA service workers
3. Bocka i **Update on reload**
4. Bocka i **Bypass for network**

## Steg 4: Hard Reload
- **Cmd+Shift+R** (Mac) eller **Ctrl+Shift+R** (Windows)

## Steg 5: Testa igen
Gå till: http://localhost:3000/crm

---

## ALTERNATIV: Använd Inkognito med rätt inställningar

1. Öppna ett **nytt** inkognito-fönster
2. Gå till **chrome://settings/content/all** i inkognito
3. Leta efter **localhost:3000**
4. Klicka på pilen och välj **Clear & reset**
5. Prova sedan: http://localhost:3000/crm