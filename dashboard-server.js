const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota de status da API
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        bot_name: 'boton',
        server: 'Crias7.aternos.me',
        port: 19132,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// 404
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
    console.log(`Dashboard rodando em http://localhost:${PORT}`);
});
