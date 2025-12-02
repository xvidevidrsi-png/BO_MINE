require('dotenv').config();
const express = require('express');
const bedrock = require('bedrock-protocol');

const BOT_NAME = process.env.BOT_NAME || 'boton';
const REAL_SERVER = process.env.SERVER_ADDRESS || 'Crias7.aternos.me';
const REAL_PORT = parseInt(process.env.SERVER_PORT || '19132');
const WEB_PORT = process.env.PORT || 5000;

const TEST_SERVERS = [
    { host: 'play.cubecraft.net', port: 19132 },
];

const app = express();
const START_TIME = Date.now();

let client = null;
let reconnectAttempts = 0;
let testMode = true;
let isInGame = false;
let currentServer = '';
const MAX_ATTEMPTS = 15;
const RETRY_DELAY = 10000;

function log(msg) {
    console.log(`>>> [BOT] ${msg}`);
}

app.get('/', (req, res) => {
    const uptime = Math.floor((Date.now() - START_TIME) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    
    const status = isInGame ? '🟢 ONLINE' : (testMode ? '🟡 TESTANDO' : '🔴 OFFLINE');
    
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Minecraft Bot Status</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="10">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
        }
        .container {
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 90%;
        }
        h1 { font-size: 2.5em; margin-bottom: 10px; }
        .status { 
            font-size: 1.8em; 
            margin: 20px 0;
            padding: 15px;
            border-radius: 10px;
            background: rgba(0,0,0,0.2);
        }
        .info { 
            background: rgba(0,0,0,0.2);
            padding: 15px;
            border-radius: 10px;
            margin: 10px 0;
            text-align: left;
        }
        .info p { margin: 8px 0; font-size: 0.95em; }
        .label { color: #888; }
        .online { color: #4ade80; }
        .testing { color: #fbbf24; }
        .offline { color: #f87171; }
        .ping { 
            margin-top: 20px;
            padding: 10px;
            background: rgba(74, 222, 128, 0.2);
            border-radius: 8px;
            font-size: 0.85em;
        }
        .help {
            margin-top: 20px;
            padding: 15px;
            background: rgba(59, 130, 246, 0.2);
            border-radius: 8px;
            text-align: left;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Bot MC</h1>
        <div class="status ${isInGame ? 'online' : (testMode ? 'testing' : 'offline')}">
            ${status}
        </div>
        <div class="info">
            <p><span class="label">Bot:</span> ${BOT_NAME}</p>
            <p><span class="label">Servidor:</span> ${currentServer || REAL_SERVER}</p>
            <p><span class="label">Porta:</span> ${REAL_PORT}</p>
            <p><span class="label">Uptime:</span> ${hours}h ${minutes}m ${seconds}s</p>
            <p><span class="label">Reconexões:</span> ${reconnectAttempts}/${MAX_ATTEMPTS}</p>
        </div>
        <div class="ping">
            ✅ Ping OK - ${new Date().toLocaleTimeString('pt-BR')}
        </div>
        <div class="help">
            <p><strong>❓ Precisa autorizar?</strong></p>
            <p>Veja os LOGS do Render para o código Microsoft</p>
        </div>
    </div>
</body>
</html>
    `);
});

app.get('/health', (req, res) => {
    const uptime = Math.floor((Date.now() - START_TIME) / 1000);
    res.json({
        status: isInGame ? 'ONLINE' : 'OFFLINE',
        ping: 'OK',
        bot: BOT_NAME,
        server: currentServer || REAL_SERVER,
        inGame: isInGame,
        uptime: uptime,
        reconnects: reconnectAttempts,
        timestamp: new Date().toISOString()
    });
});

app.get('/ping', (req, res) => {
    res.send('pong');
});

function connectBot(server = null, port = null) {
    const host = server || (testMode ? TEST_SERVERS[0].host : REAL_SERVER);
    const p = port || (testMode ? TEST_SERVERS[0].port : REAL_PORT);
    currentServer = host;
    
    log(`${'-'.repeat(50)}`);
    if (testMode) {
        log(`🧪 Testando conexão: ${host}:${p}`);
    } else {
        log(`🎮 Conectando ao seu servidor: ${host}:${p}`);
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
            log('❌ DESCONECTADO');
            scheduleReconnect();
        });

        client.on('error', (err) => {
            const errMsg = err.message || String(err);
            log('❌ ERRO: ' + errMsg);
            
            if (errMsg.includes('device')) {
                log('💡 Procure pelos logs um link microsoft.com/devicelogin');
            }
            
            // Limpar cache se detectar erro de autenticação (401, Xbox profile, UNAUTHORIZED)
            if (errMsg.includes('Xbox profile') || 
                errMsg.includes('401') || 
                errMsg.includes('UNAUTHORIZED') ||
                errMsg.includes('Unauthorized') ||
                errMsg.includes('authentication')) {
                log('🔄 Detectado erro de autenticação 401 - Limpando cache...');
                const fs = require('fs');
                const path = require('path');
                const authCachePath = path.join(__dirname, 'auth_cache');
                
                try {
                    if (fs.existsSync(authCachePath)) {
                        fs.rmSync(authCachePath, { recursive: true, force: true });
                        log('✅ Cache de autenticação removido!');
                        log('');
                        log('🔐 PRÓXIMOS PASSOS:');
                        log('1. O bot vai pedir autenticação novamente');
                        log('2. Procure nos logs por: https://microsoft.com/devicelogin');
                        log('3. Copie o código que aparecer (ex: ABCD-1234)');
                        log('4. Cole no site da Microsoft');
                        log('5. Autorize o acesso');
                        log('');
                    } else {
                        log('⚠️ Cache não encontrado, será criado na próxima autenticação');
                    }
                } catch (e) {
                    log('⚠️ Erro ao limpar cache: ' + e.message);
                }
            }
            
            scheduleReconnect();
        });

        client.on('close', () => {
            isInGame = false;
            scheduleReconnect();
        });

    } catch (error) {
        log('❌ FALHA: ' + error.message);
        isInGame = false;
        scheduleReconnect();
    }
}

function handleJoinSuccess() {
    isInGame = true;
    reconnectAttempts = 0;
    
    if (testMode) {
        log('========================================');
        log('✓ CONEXÃO BEM-SUCEDIDA');
        log('========================================');
        testMode = false;
        
        setTimeout(() => {
            log('Conectando ao seu servidor agora...');
            try { client.disconnect(); } catch(e) {}
            setTimeout(() => {
                connectBot(REAL_SERVER, REAL_PORT);
            }, 2000);
        }, 3000);
    } else {
        log('========================================');
        log('✓✓✓ BOT ENTROU NO SEU SERVIDOR! ✓✓✓');
        log('========================================');
        log(`Servidor: ${REAL_SERVER}:${REAL_PORT}`);
        log('Status: JOGANDO 24/7');
        log('========================================');
        currentServer = REAL_SERVER;
        startAntiAFK();
    }
}

function scheduleReconnect() {
    if (reconnectAttempts >= MAX_ATTEMPTS) {
        log(`${'-'.repeat(50)}`);
        log('⚠ Máximo de tentativas atingido');
        log('Aguardando 3 minutos...');
        log(`${'-'.repeat(50)}`);
        setTimeout(() => {
            reconnectAttempts = 0;
            testMode = true;
            connectBot();
        }, 180000);
        return;
    }

    reconnectAttempts++;
    const server = testMode ? TEST_SERVERS[0].host : REAL_SERVER;
    log(`Reconectando em 10s... (${reconnectAttempts}/${MAX_ATTEMPTS})`);
    setTimeout(connectBot, RETRY_DELAY);
}

let antiAfkInterval = null;

function startAntiAFK() {
    if (antiAfkInterval) clearInterval(antiAfkInterval);
    
    log('Anti-AFK: Ativado ✓');
    
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

function cleanup() {
    log('Encerrando...');
    if (antiAfkInterval) clearInterval(antiAfkInterval);
    if (client) {
        try { client.disconnect(); } catch (e) {}
    }
    process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('uncaughtException', (err) => {
    log('Erro: ' + err.message);
    scheduleReconnect();
});

console.log('\n🤖 Minecraft Bedrock Bot\n');
console.log('📡 Autenticando com Microsoft...\n');

app.listen(WEB_PORT, '0.0.0.0', () => {
    log(`📊 Dashboard: http://localhost:${WEB_PORT}`);
    log(`🔗 Health: http://localhost:${WEB_PORT}/health`);
    log(`📡 Ping: http://localhost:${WEB_PORT}/ping`);
    setTimeout(() => {
        log('\nIniciando bot...\n');
        connectBot();
    }, 1000);
});
