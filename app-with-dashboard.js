const express = require('express');
const path = require('path');
require('dotenv').config();
const bedrock = require('bedrock-protocol');

// Config Bot
const BOT_NAME = process.env.BOT_NAME || 'boton';
const SERVER_ADDRESS = process.env.SERVER_ADDRESS || 'Crias7.aternos.me';
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '19132');
const MICROSOFT_EMAIL = process.env.MICROSOFT_EMAIL;
const MICROSOFT_PASSWORD = process.env.MICROSOFT_PASSWORD;

if (!MICROSOFT_EMAIL || !MICROSOFT_PASSWORD) {
    console.log('[BOT] ERRO: Configure MICROSOFT_EMAIL e MICROSOFT_PASSWORD');
    process.exit(1);
}

// Express App
const app = express();
const WEB_PORT = process.env.PORT || 3000;

// Variáveis de status
let botStatus = {
    connected: false,
    inGame: false,
    lastUpdate: new Date(),
    totalRestarts: 0
};

// Servir HTML
app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/api/status', (req, res) => res.json(botStatus));

// BOT LOGIC
let client = null;
let reconnectAttempts = 0;
let isInGame = false;
const MAX_ATTEMPTS = 15;
const RETRY_DELAY = 10000;

function log(msg) {
    console.log(`>>> [BOT] ${msg}`);
}

function connectBot() {
    log(`${'-'.repeat(50)}`);
    log(`CONECTANDO ao servidor: ${SERVER_ADDRESS}:${SERVER_PORT}`);
    log(`Nome do bot: ${BOT_NAME}`);
    log(`${'-'.repeat(50)}`);
    
    try {
        client = bedrock.createClient({
            host: SERVER_ADDRESS,
            port: SERVER_PORT,
            username: BOT_NAME,
            offline: false,
            auth: 'microsoft',
            profilesFolder: './auth_cache',
            password: MICROSOFT_PASSWORD
        });

        client.on('connect', () => {
            log('✓ TCP CONECTADO ao servidor');
            botStatus.connected = true;
            botStatus.lastUpdate = new Date();
        });

        client.on('start_game', () => {
            isInGame = true;
            botStatus.inGame = true;
            botStatus.lastUpdate = new Date();
            log('========================================');
            log('✓✓✓ BOT ENTROU NO SERVIDOR! ✓✓✓');
            log('========================================');
            log('Status: JOGANDO AGORA');
            log('========================================');
            reconnectAttempts = 0;
            startAntiAFK();
        });

        client.on('spawn', () => {
            if (!isInGame) {
                isInGame = true;
                botStatus.inGame = true;
                botStatus.lastUpdate = new Date();
                log('========================================');
                log('✓✓✓ BOT ENTROU NO SERVIDOR! ✓✓✓');
                log('========================================');
                log('Status: JOGANDO AGORA');
                log('========================================');
                reconnectAttempts = 0;
                startAntiAFK();
            }
        });

        client.on('disconnect', () => {
            isInGame = false;
            botStatus.inGame = false;
            botStatus.connected = false;
            botStatus.lastUpdate = new Date();
            log('❌ DESCONECTADO do servidor');
            scheduleReconnect();
        });

        client.on('error', (err) => {
            log('❌ ERRO: ' + err.message);
            scheduleReconnect();
        });

        client.on('close', () => {
            isInGame = false;
            botStatus.inGame = false;
            botStatus.connected = false;
            botStatus.lastUpdate = new Date();
            log('❌ Conexao fechada');
            scheduleReconnect();
        });

    } catch (error) {
        log('❌ FALHA ao conectar: ' + error.message);
        isInGame = false;
        botStatus.inGame = false;
        botStatus.connected = false;
        scheduleReconnect();
    }
}

function scheduleReconnect() {
    if (reconnectAttempts >= MAX_ATTEMPTS) {
        botStatus.totalRestarts++;
        log(`${'-'.repeat(50)}`);
        log('⚠ Maximo de tentativas atingido');
        log('Esperando 3 minutos antes de tentar novamente...');
        log(`${'-'.repeat(50)}`);
        setTimeout(() => {
            reconnectAttempts = 0;
            connectBot();
        }, 180000);
        return;
    }

    reconnectAttempts++;
    log(`Reconectando... (${reconnectAttempts}/${MAX_ATTEMPTS}) em 10s`);
    setTimeout(connectBot, RETRY_DELAY);
}

let antiAfkInterval = null;

function startAntiAFK() {
    if (antiAfkInterval) clearInterval(antiAfkInterval);
    
    log('Anti-AFK: Ativado (mexendo cabeca a cada 50s)');
    
    antiAfkInterval = setInterval(() => {
        if (!client || !isInGame) return;
        
        try {
            client.queue('player_action', {
                runtime_entity_id: 0n,
                action: 'start_sneak',
                position: { x: 0, y: 0, z: 0 },
                result_position: { x: 0, y: 0, z: 0 },
                face: 0
            });
            
            setTimeout(() => {
                try {
                    if (client && isInGame) {
                        client.queue('player_action', {
                            runtime_entity_id: 0n,
                            action: 'stop_sneak',
                            position: { x: 0, y: 0, z: 0 },
                            result_position: { x: 0, y: 0, z: 0 },
                            face: 0
                        });
                    }
                } catch (e) {}
            }, 300);
            
        } catch (e) {}
    }, 50000);
}

// Start
console.log('\n🤖 Minecraft Bedrock Bot + Dashboard\n');
console.log(`📊 Dashboard: http://localhost:${WEB_PORT}\n`);

app.listen(WEB_PORT, () => {
    log(`Dashboard web iniciado na porta ${WEB_PORT}`);
    setTimeout(() => connectBot(), 1000);
});

process.on('SIGINT', () => {
    log('Encerrando...');
    if (antiAfkInterval) clearInterval(antiAfkInterval);
    if (client) {
        try { client.disconnect(); } catch (e) {}
    }
    process.exit(0);
});
