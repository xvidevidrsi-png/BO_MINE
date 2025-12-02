require('dotenv').config();
const bedrock = require('bedrock-protocol');

const BOT_NAME = process.env.BOT_NAME || 'boton';
const SERVER_ADDRESS = process.env.SERVER_ADDRESS || 'Crias7.aternos.me';
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '19132');
const MICROSOFT_EMAIL = process.env.MICROSOFT_EMAIL;
const MICROSOFT_PASSWORD = process.env.MICROSOFT_PASSWORD;

if (!MICROSOFT_EMAIL || !MICROSOFT_PASSWORD) {
    console.error('[BOT] ERRO: MICROSOFT_EMAIL ou MICROSOFT_PASSWORD nao configurados!');
    process.exit(1);
}

let client = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 15000;

function log(msg) {
    console.log(`[BOT] ${msg}`);
}

function connectBot() {
    log(`Conectando a ${SERVER_ADDRESS}:${SERVER_PORT}...`);
    
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
            log('Conectado');
            reconnectAttempts = 0;
        });

        client.on('spawn', () => {
            log('Bot online');
            startHeadMovement();
        });

        client.on('disconnect', () => {
            log('Desconectado');
            scheduleReconnect();
        });

        client.on('error', (err) => {
            if (!err.message.includes('timeout')) {
                log('Erro: ' + err.message);
            }
            scheduleReconnect();
        });

        client.on('close', () => {
            scheduleReconnect();
        });

    } catch (error) {
        log('Erro: ' + error.message);
        scheduleReconnect();
    }
}

function scheduleReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        log('Aguardando 2 minutos antes de reconectar...');
        setTimeout(() => {
            reconnectAttempts = 0;
            connectBot();
        }, 120000);
        return;
    }

    reconnectAttempts++;
    log(`Reconectando em 15s (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    
    setTimeout(connectBot, RECONNECT_DELAY);
}

let headInterval = null;

function startHeadMovement() {
    if (headInterval) clearInterval(headInterval);
    
    let yaw = 0;
    let pitch = 0;
    
    headInterval = setInterval(() => {
        if (!client) return;
        
        try {
            // Pequenos movimentos de cabeça
            yaw += 5;
            if (yaw > 360) yaw = 0;
            
            client.queue('player_action', {
                runtime_entity_id: 0n,
                action: 'start_sneak',
                position: { x: 0, y: 0, z: 0 },
                result_position: { x: 0, y: 0, z: 0 },
                face: 0
            });
            
            setTimeout(() => {
                try {
                    if (client) {
                        client.queue('player_action', {
                            runtime_entity_id: 0n,
                            action: 'stop_sneak',
                            position: { x: 0, y: 0, z: 0 },
                            result_position: { x: 0, y: 0, z: 0 },
                            face: 0
                        });
                    }
                } catch (e) {}
            }, 200);
            
        } catch (e) {
            // Ignore
        }
    }, 45000); // A cada 45 segundos
}

function cleanup() {
    log('Encerrando...');
    if (headInterval) clearInterval(headInterval);
    if (client) {
        try {
            client.disconnect();
        } catch (e) {}
    }
    setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

process.on('uncaughtException', (err) => {
    log('Erro: ' + err.message);
    scheduleReconnect();
});

connectBot();
