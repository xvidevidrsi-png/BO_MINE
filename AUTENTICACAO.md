# 🔐 Autenticação Microsoft - Device Code Flow

## Como funciona?

A Microsoft exige autenticação segura (Device Code Flow). Não é possível usar email/senha diretamente.

---

## ✅ Primeira execução (PRIMEIRA VEZ):

1. **Bot inicia** e mostra:
```
>>> [BOT] Entre em: https://microsoft.com/devicelogin
>>> [BOT] Digite o código: ABC123DEF
```

2. **Você acessa** a URL em seu navegador

3. **Digita o código** que o bot mostrou

4. **Clica em "Autorizar"** no seu Microsoft

5. **Pronto!** Token é salvo em `./auth_cache/`

---

## 🔄 Próximas execuções (AUTOMÁTICO):

- Bot detecta token em cache
- Conecta automaticamente
- **Sem necessidade de fazer nada!**

---

## 📋 No Render.com:

**Não precisa** adicionar variáveis de Microsoft:
- ❌ MICROSOFT_EMAIL (REMOVER)
- ❌ MICROSOFT_PASSWORD (REMOVER)

**Só precisa:**
- BOT_NAME
- SERVER_ADDRESS
- SERVER_PORT

---

## 🆘 Se o token expirar:

Delete a pasta `./auth_cache/` e rode de novo (vai pedir código novamente).

---

## 💡 Por que assim?

✅ Mais seguro (sem senhas)  
✅ Suporta autenticação 2FA  
✅ Token válido por longo tempo  
✅ Funciona mesmo que Microsoft mude senha
