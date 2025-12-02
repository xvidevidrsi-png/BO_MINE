# Bot Minecraft Bedrock - Render.com

Bot extremamente leve para manter servidor 24h online.

## Setup Render

1. **Ir em Render.com** → Sign up
2. **Novo Web Service** → Connect GitHub
3. **Configuração:**
   - Name: `minecraft-bot`
   - Environment: `Node`
   - Build: `npm install`
   - Start: `npm start`

4. **Environment Variables:**
   - `MICROSOFT_EMAIL` = seu email
   - `MICROSOFT_PASSWORD` = sua senha
   - `BOT_NAME` = boton
   - `SERVER_ADDRESS` = Crias7.aternos.me
   - `SERVER_PORT` = 19132

5. **Deploy!**

## Tudo Pronto

Arquivos necessários:
- app.js
- package.json
- .env (local, não versionar)

Bot mexe cabeça a cada 45s para não sofrer kick por AFK.

Logs mostram status:
```
[BOT] Conectando...
[BOT] Conectado
[BOT] Bot online
```

FIM!
