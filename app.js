require('dotenv').config();
const bedrock = require('bedrock-protocol');

const BOT_NAME = process.env.BOT_NAME || 'boton';
const SERVER_ADDRESS = process.env.SERVER_ADDRESS || 'Crias7.aternos.me';
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '19132');
const MICROSOFT_EMAIL = process.env.MICROSOFT_EMAIL;
const MICROSOFT_PASSWORD = process.env.MICROSOFT_PASSWORD;

if (!MICROSOFT_EMAIL || !MICROSOFT_PASSWORD) {
    console.error('[BOT] ERRO: Configure MICROSOFT_EMAIL e MICROSOFT_PASSWORD');
    process.exit(1);
}

let client = null;
let reconnectAttempts = 0;
let isSpawned = false;
const MAX_ATTEMPTS = 15;
const RETRY_DELAY = 10000;

function log(msg) {
    const now = new Date().toLocaleTimeString();
    console.log(`[${now}] [BOT] ${msg}`);
}

function connectBot() {
    log(`Entrando no servidor ${SERVER_ADDRESS}:${SERVER_PORT}...`);
    
    try {
        client = bedrock.createClient({
            host: SERVER_ADDRESS,
            port: SERVER_PORT,
            username: BOT_NAME,
            offline: false,
            auth: 'microsoft',
            profilesFolder: './auth_cache',
            password: MICROSOFT_PASSWORD,
            realms: false
        });

        let connectedFlag = false;
        let spawnedFlag = false;

        client.on('connect', () => {
            if (!connectedFlag) {
                log('Conectado ao servidor!');
                connectedFlag = true;
                reconnectAttempts = 0;
            }
        });

        client.on('start_game', (packet) => {
            log('Jogo iniciado - Bot entrou no servidor!');
            isSpawned = true;
            spawnedFlag = true;
            startAntiAFK();
        });

        client.on('spawn', () => {
            if (!spawnedFlag) {
                log('Bot em jogo - Online agora!');
                isSpawned = true;
                spawnedFlag = true;
                startAntiAFK();
            }
        });

        client.on('join_game', () => {
            log('Join game recebido');
        });

        client.on('disconnect', (packet) => {
            log('Desconectado do servidor');
            isSpawned = false;
            scheduleReconnect();
        });

        client.on('error', (err) => {
            log('Erro: ' + err.message);
            isSpawned = false;
            scheduleReconnect();
        });

        client.on('close', () => {
            log('Conexao fechada');
            isSpawned = false;
            scheduleReconnect();
        });

        client.on('text', (packet) => {
            if (packet.message) {
                log('Chat: ' + packet.message);
            }
        });

    } catch (error) {
        log('Erro de conexao: ' + error.message);
        isSpawned = false;
        scheduleReconnect();
    }
}

function scheduleReconnect() {
    if (reconnectAttempts >= MAX_ATTEMPTS) {
        log('Max tentativas atingidas. Esperando 3 minutos...');
        setTimeout(() => {
            reconnectAttempts = 0;
            connectBot();
        }, 180000);
        return;
    }

    reconnectAttempts++;
    log(`Reconectando em 10s... (${reconnectAttempts}/${MAX_ATTEMPTS})`);
    setTimeout(connectBot, RETRY_DELAY);
}

let antiAfkInterval = null;

function startAntiAFK() {
    if (antiAfkInterval) clearInterval(antiAfkInterval);
    
    antiAfkInterval = setInterval(() => {
        if (!client || !isSpawned) return;
        
        try {
            // Mexer cabeça
            client.queue('player_action', {
                runtime_entity_id: 0n,
                action: 'start_sneak',
                position: { x: 0, y: 0, z: 0 },
                result_position: { x: 0, y: 0, z: 0 },
                face: 0
            });
            
            setTimeout(() => {
                try {
                    if (client && isSpawned) {
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
            
        } catch (e) {
            // Ignore
        }
    }, 50000);
}

function cleanup() {
    log('Encerrando...');
    if (antiAfkInterval) clearInterval(antiAfkInterval);
    if (client) {
        try {
            client.disconnect();
        } catch (e) {}
    }
    process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('uncaughtException', (err) => {
    log('Erro nao tratado: ' + err.message);
    scheduleReconnect();
});

// Inicia conexao
connectBot();
