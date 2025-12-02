# Minecraft Bedrock Bot - RENDER SETUP

## Bot entra no servidor e mexe cabeça para nao sofrer AFK kick

### Setup (5 minutos)

1. **GitHub** - Coloque esses arquivos:
   - app.js
   - package.json
   - .env.example

2. **Render.com**:
   - Sign up / Login
   - New Web Service
   - Connect GitHub
   
3. **Configure**:
   - Name: minecraft-bot
   - Build: npm install
   - Start: npm start

4. **Environment Variables**:
   - MICROSOFT_EMAIL = seu_email@hotmail.com
   - MICROSOFT_PASSWORD = sua_senha
   - BOT_NAME = boton
   - SERVER_ADDRESS = Crias7.aternos.me
   - SERVER_PORT = 19132

5. **Deploy** e pronto!

### Logs esperados

```
[07:30:15] [BOT] Entrando no servidor...
[07:30:20] [BOT] Conectado ao servidor!
[07:30:25] [BOT] Jogo iniciado - Bot entrou!
[07:30:25] [BOT] Bot em jogo - Online agora!
```

### Como saber que funciona

✅ Viu "Bot em jogo - Online agora!" = Bot entrou e esta jogando
✅ Se cair, reconecta automaticamente (ate 15 tentativas)
✅ Mexe cabeca a cada 50s para nao levar AFK kick

### Pronto!

Bot mantem seu servidor online 24h
