# 🚀 Minecraft Bedrock Bot - Setup Render.com

## ✅ Otimizações incluídas:

- **RAM**: Limitada a 256MB (ideal para Render Free)
- **Garbage Collection**: Automática a cada 5 minutos
- **Uptime Monitor**: Logs a cada 10 minutos
- **Auto-Reconexão**: Até 5 tentativas inteligentes
- **Cleanup**: Limpeza automática de memória

---

## 📋 Passo a Passo no Render

### 1️⃣ Crie uma conta no Render
- Acesse: https://render.com
- Clique em **"Sign up"**
- Use GitHub, Google ou email

### 2️⃣ Conecte seu GitHub
- Dashboard → **"New"** → **"Web Service"**
- Selecione **"Build and deploy from a Git repository"**
- Conecte sua conta GitHub

### 3️⃣ Escolha o repositório
- Se não tem, faça um fork deste projeto
- Ou crie um novo repositório com os arquivos:
  - `app.js`
  - `config.js`
  - `package.json`
  - `.env.example`
  - `Procfile`
  - `render.yaml`

### 4️⃣ Configure o serviço

**Name:**
```
minecraft-bedrock-bot
```

**Environment:**
```
Node
```

**Build Command:**
```
npm install
```

**Start Command:**
```
npm start
```

(O `Procfile` e `render.yaml` serão detectados automaticamente)

### 5️⃣ Adicione as variáveis de ambiente

Clique em **"Environment"** e adicione:

| Variável | Valor | Exemplo |
|----------|-------|---------|
| `MICROSOFT_EMAIL` | Seu email Microsoft | `seu_email@hotmail.com` |
| `MICROSOFT_PASSWORD` | Sua senha | `SuaSenha@123` |
| `BOT_NAME` | Nome do bot | `boton` |
| `SERVER_ADDRESS` | IP/Host do servidor | `Crias7.aternos.me` |
| `SERVER_PORT` | Porta Bedrock | `19132` |

### 6️⃣ Deploy
- Clique em **"Create Web Service"**
- Aguarde o deploy (2-3 minutos)
- Veja os logs para confirmar conexão

---

## 📊 Monitorando o Bot

**Via Dashboard Render:**
- Vá em **"Logs"**
- Você verá mensagens como:
  ```
  [07:30:15] [BOT] Iniciando...
  [07:30:20] [BOT] ✅ Conectado ao servidor!
  [07:30:25] [BOT] 🟢 Online.
  [07:40:25] [BOT] 📊 Status: Online | Uptime: 10m 0s | RAM: 120MB/256MB
  ```

**Status esperado:**
- 🟢 **Online**: Bot conectado e rodando
- 🔄 **Reconectando**: Tentando conectar (normal em falhas)
- 🛑 **Encerrando**: Entrando em manutenção

---

## ⚙️ Troubleshooting

### ❌ Bot não conecta
- Verifique email/senha Microsoft
- Certifique-se que o servidor está online
- Verifique a porta (19132 é padrão Bedrock)

### ❌ Timeout ou conexão cai
- Render pode ter problemas de UDP
- Isso é limitação da plataforma, não do bot
- Tente reconectar manualmente via Dashboard

### ❌ Uso alto de memória
- Logs mostram RAM:
  - `120MB/256MB` ✅ Bom
  - `240MB/256MB` ⚠️ Alto, bot pode falhar
- Se consistente, aumente em `package.json`:
  ```json
  "start": "node --max-old-space-size=512 app.js"
  ```

### ❌ Bot sai do ar após X horas
- Render Free pode reiniciar periodicamente
- O bot se reconecta automaticamente
- Para sempre online, considere plano pago

---

## 💡 Dicas

**Manter sempre online:**
- Configure alertas no Dashboard
- Monitore os logs regularmente
- Use o status check a cada 10 minutos

**Economizar RAM:**
- Não mude `--max-old-space-size` a menos que necessário
- Bot ajusta automaticamente para Render Free

**Performance:**
- Render Free usa recursos compartilhados
- Uptime pode variar (80-99%)
- Para produção, considere plano pago

---

## 🔗 Recursos úteis

- [Render Docs](https://render.com/docs)
- [Node.js em Render](https://render.com/docs/deploy-node-express-app)
- [bedrock-protocol](https://github.com/PrismarineJS/bedrock-protocol)

---

**Versão:** 1.0.0 Render  
**Última atualização:** 02/12/2024  
**Status:** ✅ Funcionando
