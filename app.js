require('dotenv').config();
const bedrock = require('bedrock-protocol');

const BOT_NAME = process.env.BOT_NAME || 'boton';
const SERVER_ADDRESS = process.env.SERVER_ADDRESS || 'localhost';
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '19132');
const MICROSOFT_EMAIL = process.env.MICROSOFT_EMAIL;
const MICROSOFT_PASSWORD = process.env.MICROSOFT_PASSWORD;

if (!MICROSOFT_EMAIL || !MICROSOFT_PASSWORD) {
    console.error('[BOT] ❌ ERRO: MICROSOFT_EMAIL ou MICROSOFT_PASSWORD não configurados!');
    process.exit(1);
}

let client = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 20000;

function log(message) {
    console.log(`[BOT] ${message}`);
}

function connectBot() {
    log(`Iniciando...`);
    log(`📋 Nome: ${BOT_NAME}`);
    log(`🌐 Servidor: ${SERVER_ADDRESS}:${SERVER_PORT}`);
    
    try {
        client = bedrock.createClient({
            host: SERVER_ADDRESS,
            port: SERVER_PORT,
            username: MICROSOFT_EMAIL,
            offline: false,
            auth: 'microsoft',
            profilesFolder: './auth_cache'
        });

        client.on('connect', () => {
            log('Conectado ao servidor!');
            reconnectAttempts = 0;
        });

        client.on('spawn', () => {
            log('Online.');
            startAntiAFK();
        });

        client.on('disconnect', (packet) => {
            log(`Desconectado. Tentando reconectar em 20s...`);
            scheduleReconnect();
        });

        client.on('error', (err) => {
            log(`⚠️ Erro: ${err.message}`);
            scheduleReconnect();
        });

    } catch (error) {
        log(`❌ Erro ao conectar: ${error.message}`);
        scheduleReconnect();
    }
}

function scheduleReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        log(`⚠️ Máximo de tentativas atingido. Aguardando 5 minutos...`);
        setTimeout(() => {
            reconnectAttempts = 0;
            connectBot();
        }, 300000);
        return;
    }

    reconnectAttempts++;
    log(`🔄 Reconectando... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    
    setTimeout(() => {
        connectBot();
    }, RECONNECT_DELAY);
}

let afkInterval = null;
function startAntiAFK() {
    if (afkInterval) clearInterval(afkInterval);
    
    afkInterval = setInterval(() => {
        if (client) {
            try {
                client.queue('player_action', {
                    runtime_entity_id: 0n,
                    action: 'start_sneak',
                    position: { x: 0, y: 0, z: 0 },
                    result_position: { x: 0, y: 0, z: 0 },
                    face: 0
                });
                
                setTimeout(() => {
                    if (client) {
                        client.queue('player_action', {
                            runtime_entity_id: 0n,
                            action: 'stop_sneak',
                            position: { x: 0, y: 0, z: 0 },
                            result_position: { x: 0, y: 0, z: 0 },
                            face: 0
                        });
                    }
                }, 500);
            } catch (err) {
                // Silently ignore
            }
        }
    }, 60000);
}

process.on('SIGINT', () => {
    log('Encerrando...');
    if (afkInterval) clearInterval(afkInterval);
    if (client) {
        try {
            client.disconnect();
        } catch (e) {}
    }
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    log(`⚠️ Erro: ${err.message}`);
    scheduleReconnect();
});

connectBot();