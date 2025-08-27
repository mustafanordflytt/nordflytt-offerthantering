# Installation av MCP och Puppeteer

## Problem med npm permissions
Det verkar finnas ett permissions-problem med npm cache. Kör först:

```bash
sudo chown -R $(whoami) ~/.npm
```

## Installera beroenden

```bash
# Installera MCP SDK och Puppeteer
npm install @modelcontextprotocol/sdk puppeteer puppeteer-core --legacy-peer-deps

# För testning
npm install --save-dev jest puppeteer @types/jest
```

## Konfiguration

### 1. MCP Context Configuration
Filen `mcp-config.json` innehåller all kontext om projektet:
- Arkitekturbeslut
- Affärsregler (priser, workflows)
- Kodmönster
- Feature-översikt

### 2. Puppeteer Tests
Automatiska tester finns i `tests/puppeteer/staff-app.test.js`:
- Login flow
- Dashboard funktionalitet
- Smart features (foto, prissättning)
- Mobile optimization
- Error handling

## Köra tester

```bash
# Starta utvecklingsservern först
npm run dev

# I en annan terminal, kör tester
npx jest tests/puppeteer/staff-app.test.js

# Eller lägg till i package.json:
"scripts": {
  "test:e2e": "jest tests/puppeteer/*.test.js"
}
```

## Fördelar med denna setup

### MCP (Model Context Protocol)
- AI förstår hela systemets arkitektur
- Kommer ihåg alla affärsregler
- Genererar kod som följer etablerade mönster
- Undviker konflikter mellan olika delar

### Puppeteer
- Testar i riktig browser (Chrome)
- Verifierar att all funktionalitet fungerar
- Testar responsiv design
- Upptäcker regressioner direkt

### Tillsammans
- Ändringar verifieras automatiskt
- AI kan se testresultat och fixa problem
- Säkerställer kvalitet i varje release
- Dokumenterar förväntat beteende

## Tips för utveckling

1. **Innan stora ändringar**: Kör alltid testerna först
2. **Efter ändringar**: Verifiera med Puppeteer att allt fungerar
3. **Vid nya features**: Lägg till motsvarande tester
4. **Uppdatera MCP config**: När arkitekturbeslut ändras

## Exempel på användning med AI

```
"Använd MCP context och kör Puppeteer-tester efter varje ändring"
"Baserat på mcp-config.json, implementera ny feature X"
"Kör e2e-tester och fixa eventuella fel"
```

Detta ger AI superintelligens om projektet!