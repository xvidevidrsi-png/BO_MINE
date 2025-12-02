# 🎮 Minecraft Bedrock AFK Bot

Bot automatizado para manter seu servidor Minecraft Bedrock online 24/7.

## 📋 Arquivos do Projeto

- **app.js** - Aplicação principal do bot
- **config.js** - Configurações centralizadas
- **package.json** - Dependências Node.js
- **.env.example** - Exemplo de variáveis de ambiente
- **.env** - Suas credenciais (não versionar!)

## 🚀 Instalação na ALAVPS

### 1️⃣ Conectar na VPS

```bash
ssh root@SEU-IP-DA-VPS
```

### 2️⃣ Instalar Node.js

```bash
apt update
apt install -y nodejs npm
node -v && npm -v
```

### 3️⃣ Criar pasta e clonar

```bash
mkdir bot
cd bot
# Cole seus arquivos aqui (app.js, config.js, package.json, .env)
```

### 4️⃣ Configurar .env

```bash
nano .env
```

Cole:
```
MICROSOFT_EMAIL=seu_email@microsoft.com
MICROSOFT_PASSWORD=sua_senha
BOT_NAME=boton
SERVER_ADDRESS=Crias7.aternos.me
SERVER_PORT=19132
```

Salve: `CTRL+O` → `ENTER` → `CTRL+X`

### 5️⃣ Instalar dependências

```bash
npm install
```

### 6️⃣ Testar o bot

```bash
node app.js
```

Verifique se vê:
```
[BOT] Iniciando...
[BOT] Conectado ao servidor!
[BOT] Online.
```

### 7️⃣ Rodar 24h com PM2

```bash
npm install -g pm2
pm2 start app.js --name "minecraft-bot"
pm2 save
pm2 startup
```

### ✅ Comandos úteis

```bash
pm2 status              # Ver status
pm2 logs minecraft-bot  # Ver logs
pm2 stop minecraft-bot  # Parar
pm2 restart minecraft-bot  # Reiniciar
pm2 delete minecraft-bot   # Remover
```

## 📊 Logs

Você verá no console:

```
[BOT] Iniciando...
[BOT] 📋 Nome: boton
[BOT] 🌐 Servidor: Crias7.aternos.me:19132
[BOT] Conectado ao servidor!
[BOT] Online.
```

Se cair:
```
[BOT] Desconectado. Tentando reconectar em 20s...
```

## ⚙️ Configuração

Editar `config.js` para alterar:

- `MAX_RECONNECT_ATTEMPTS` - Tentativas de reconexão
- `RECONNECT_DELAY` - Tempo entre tentativas (ms)
- `AFK_CHECK_INTERVAL` - Intervalo de movimento anti-AFK (ms)

## 🔐 Segurança

⚠️ **NUNCA** compartilhe seu `.env`!

- `.env` contém suas credenciais Microsoft
- Adicione `.env` ao `.gitignore`
- Use apenas em máquinas confiáveis

## 🆘 Troubleshooting

**Erro: MICROSOFT_EMAIL ou MICROSOFT_PASSWORD não configurados**
- Verifique se o arquivo `.env` existe
- Certifique-se de ter preenchido as credenciais

**Bot desconecta logo após conectar**
- Verifique credenciais Microsoft
- Certifique-se de que o servidor está online
- Verifique a porta (padrão: 19132)

**PM2 não inicia o bot**
- Rode `node app.js` diretamente para ver erros
- Verifique se Node.js foi instalado corretamente

## 📝 Versão

Versão: 1.0.0
Compatível com: Node.js 14+
