# 🚀 Setup no Render.com - Passo a Passo

## ✅ Se você já está no Render:

### 1️⃣ Veja os LOGS
- Clica em "Logs" no dashboard do Render
- Procura por:
  ```
  Entre em: https://microsoft.com/devicelogin
  Digite o código: ABCDE12345
  ```

### 2️⃣ Vai no navegador
- Abre: `https://microsoft.com/devicelogin`
- Cola o código que apareceu nos logs
- Clica em "Autorizar"

### 3️⃣ Aprova no Microsoft
- Clica em "Sim" para autorizar o bot

### 4️⃣ Pronto!
- Volta aos logs do Render
- Bot automaticamente conecta ao seu servidor

---

## 📝 Variáveis no Render (Environment):

```
BOT_NAME = boton
SERVER_ADDRESS = Crias7.aternos.me
SERVER_PORT = 19132
```

**NÃO adiciona:**
- ❌ MICROSOFT_EMAIL
- ❌ MICROSOFT_PASSWORD

---

## ⚠️ Importante:

- **PRIMEIRO DEPLOY:** Código aparece nos LOGS (não no email)
- **PRÓXIMOS DEPLOYS:** Bot conecta automático (sem código)
- **Código válido por:** Cerca de 15 minutos

---

## 🔍 Como saber se deu certo?

Nos logs do Render vai aparecer:
```
>>> [BOT] ✓ TCP CONECTADO
>>> [BOT] ✓✓✓ BOT ENTROU NO SEU SERVIDOR! ✓✓✓
>>> [BOT] Anti-AFK: Ativado
```

Se aparecer isso, o bot está 24/7! ✅
