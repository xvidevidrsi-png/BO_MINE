const express = require('express');
const path = require('path');
require('dotenv').config();
const bedrock = require('bedrock-protocol');

const BOT_NAME = process.env.BOT_NAME || 'boton';
const REAL_SERVER = process.env.SERVER_ADDRESS || 'Crias7.aternos.me';
const REAL_PORT = parseInt(process.env.SERVER_PORT || '19132');

const TEST_SERVERS = [
    { host: 'play.cubecraft.net', port: 19132 },
    { host: 'play.galaxite.net', port: 19132 },
];


const app = express();
const WEB_PORT = process.env.PORT || 3000;
const START_TIME = Date.now();

let botStatus = {
    connected: false,
    inGame: false,
    lastUpdate: new Date(),
    totalRestarts: 0,
    currentServer: '',
    testMode: true
};

app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/api/status', (req, res) => res.json(botStatus));

app.get('/health', (req, res) => {
    const uptime = Math.floor((Date.now() - START_TIME) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    
    const health = {
        status: botStatus.inGame ? 'ONLINE' : (botStatus.connected ? 'CONNECTING' : 'OFFLINE'),
        health_code: botStatus.inGame ? 200 : (botStatus.connected ? 101 : 503),
        bot: {
            name: BOT_NAME,
            connected: botStatus.connected,
            inGame: botStatus.inGame,
            reconnectAttempts: reconnectAttempts,
            maxAttempts: MAX_ATTEMPTS,
            totalRestarts: botStatus.totalRestarts,
            testMode: testMode,
            currentServer: botStatus.currentServer
        },
        server: {
            target: REAL_SERVER,
            port: REAL_PORT,
            type: 'Bedrock Edition'
        },
        uptime: {
            seconds: uptime,
            formatted: `${hours}h ${minutes}m ${seconds}s`
        },
        timestamps: {
            started: new Date(START_TIME),
            lastUpdate: botStatus.lastUpdate,
            now: new Date()
        }
    };
    
    res.status(botStatus.inGame ? 200 : 503).json(health);
});

let client = null;
let reconnectAttempts = 0;
let testMode = true;
let testIndex = 0;
let isInGame = false;
const MAX_ATTEMPTS = 15;
const RETRY_DELAY = 10000;

function log(msg) {
    console.log(`>>> [BOT] ${msg}`);
}

function connectBot(server = null, port = null) {
    const host = server || (testMode ? TEST_SERVERS[testIndex].host : REAL_SERVER);
    const p = port || (testMode ? TEST_SERVERS[testIndex].port : REAL_PORT);
    
    botStatus.currentServer = host;
    botStatus.testMode = testMode;
    botStatus.lastUpdate = new Date();
    
    log(`${'-'.repeat(50)}`);
    if (testMode) {
        log(`🧪 TESTANDO servidor: ${host}:${p}`);
    } else {
        log(`🎮 CONECTANDO ao seu servidor: ${host}:${p}`);
    }
    log(`Nome do bot: ${BOT_NAME}`);
    log(`${'-'.repeat(50)}`);
    
    try {
        client = bedrock.createClient({
            host: host,
            port: p,
            username: BOT_NAME,
            offline: false,
            auth: 'microsoft',
            profilesFolder: './auth_cache'
        });

        client.on('connect', () => {
            log('✓ TCP CONECTADO');
            botStatus.connected = true;
            botStatus.lastUpdate = new Date();
        });

        client.on('start_game', () => {
            handleJoinSuccess();
        });

        client.on('spawn', () => {
            if (!isInGame) {
                handleJoinSuccess();
            }
        });

        client.on('disconnect', () => {
            isInGame = false;
            botStatus.inGame = false;
            botStatus.connected = false;
            botStatus.lastUpdate = new Date();
            log('❌ DESCONECTADO');
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
            scheduleReconnect();
        });

    } catch (error) {
        log('❌ FALHA: ' + error.message);
        isInGame = false;
        botStatus.inGame = false;
        botStatus.connected = false;
        scheduleReconnect();
    }
}

function handleJoinSuccess() {
    isInGame = true;
    botStatus.inGame = true;
    botStatus.lastUpdate = new Date();
    reconnectAttempts = 0;
    
    if (testMode) {
        log('========================================');
        log('✓ TESTE BEM-SUCEDIDO!');
        log('========================================');
        testMode = false;
        botStatus.testMode = false;
        
        setTimeout(() => {
            log('Desconectando do servidor de teste...');
            try { client.disconnect(); } catch(e) {}
            setTimeout(() => {
                log('Agora conectando ao seu servidor...');
                connectBot(REAL_SERVER, REAL_PORT);
            }, 2000);
        }, 3000);
    } else {
        log('========================================');
        log('✓✓✓ BOT ENTROU NO SEU SERVIDOR! ✓✓✓');
        log('========================================');
        log('Status: JOGANDO AGORA');
        log(`Servidor: ${REAL_SERVER}:${REAL_PORT}`);
        log('========================================');
        startAntiAFK();
    }
}

function scheduleReconnect() {
    if (reconnectAttempts >= MAX_ATTEMPTS) {
        botStatus.totalRestarts++;
        log(`${'-'.repeat(50)}`);
        log('⚠ Maximo de tentativas atingido');
        log('Esperando 3 minutos...');
        log(`${'-'.repeat(50)}`);
        setTimeout(() => {
            reconnectAttempts = 0;
            testIndex = 0;
            testMode = true;
            botStatus.testMode = true;
            connectBot();
        }, 180000);
        return;
    }

    reconnectAttempts++;
    const server = testMode ? TEST_SERVERS[testIndex].host : REAL_SERVER;
    log(`Reconectando em 10s... (${reconnectAttempts}/${MAX_ATTEMPTS}) - ${server}`);
    setTimeout(connectBot, RETRY_DELAY);
}

let antiAfkInterval = null;

function startAntiAFK() {
    if (antiAfkInterval) clearInterval(antiAfkInterval);
    
    log('Anti-AFK: Ativado (agachando a cada 50s)');
    
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

console.log('\n🤖 Minecraft Bedrock Bot + Dashboard\n');
console.log('📋 FLUXO:');
console.log('1. Testa conexão em servidor público');
console.log('2. Se OK, conecta no seu servidor');
console.log(`\n📊 Dashboard: http://localhost:${WEB_PORT}\n`);

app.listen(WEB_PORT, () => {
    log(`Dashboard iniciado na porta ${WEB_PORT}`);
    log(`Health check: http://localhost:${WEB_PORT}/health`);
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

process.on('uncaughtException', (err) => {
    log('Erro: ' + err.message);
    scheduleReconnect();
});
