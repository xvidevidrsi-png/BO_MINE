require('dotenv').config();
const bedrock = require('bedrock-protocol');
const config = require('./config');

const BOT_NAME = config.BOT_NAME;
const SERVER_ADDRESS = config.SERVER_ADDRESS;
const SERVER_PORT = config.SERVER_PORT;
const MICROSOFT_EMAIL = config.MICROSOFT_EMAIL;
const MICROSOFT_PASSWORD = config.MICROSOFT_PASSWORD;
const MAX_RECONNECT_ATTEMPTS = config.MAX_RECONNECT_ATTEMPTS;
const RECONNECT_DELAY = config.RECONNECT_DELAY;
const MEMORY_CLEANUP_INTERVAL = config.MEMORY_CLEANUP_INTERVAL;

if (!MICROSOFT_EMAIL || !MICROSOFT_PASSWORD) {
    console.error('[BOT] ❌ ERRO: MICROSOFT_EMAIL ou MICROSOFT_PASSWORD não configurados!');
    console.error('[BOT] Configure o arquivo .env com suas credenciais.');
    process.exit(1);
}

let client = null;
let reconnectAttempts = 0;
let startTime = Date.now();

function log(message) {
    const time = new Date().toLocaleTimeString('pt-BR');
    console.log(`[${time}] [BOT] ${message}`);
}

function getUptime() {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
}

function getMemoryUsage() {
    const used = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const total = Math.round(process.memoryUsage().heapTotal / 1024 / 1024);
    return `${used}MB/${total}MB`;
}

function connectBot() {
    log(`Iniciando...`);
    log(`📋 Bot: ${BOT_NAME} | Uptime: ${getUptime()} | RAM: ${getMemoryUsage()}`);
    log(`🌐 ${SERVER_ADDRESS}:${SERVER_PORT}`);
    
    try {
        client = bedrock.createClient({
            host: SERVER_ADDRESS,
            port: SERVER_PORT,
            username: MICROSOFT_EMAIL,
            offline: false,
            auth: 'microsoft',
            profilesFolder: './auth_cache',
            skipValidation: true
        });

        client.on('connect', () => {
            log('✅ Conectado ao servidor!');
            reconnectAttempts = 0;
        });

        client.on('spawn', () => {
            log('🟢 Online.');
            startAntiAFK();
            startMemoryCleanup();
            startStatusLog();
        });

        client.on('disconnect', (packet) => {
            log(`🔴 Desconectado. Tentando reconectar...`);
            scheduleReconnect();
        });

        client.on('error', (err) => {
            if (!err.message.includes('timeout')) {
                log(`⚠️ Erro: ${err.message}`);
            }
            scheduleReconnect();
        });

        client.on('close', () => {
            log(`⚠️ Conexão fechada.`);
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
let memoryInterval = null;
let statusInterval = null;

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
                // Ignore
            }
        }
    }, config.AFK_CHECK_INTERVAL);
}

function startMemoryCleanup() {
    if (memoryInterval) clearInterval(memoryInterval);
    
    memoryInterval = setInterval(() => {
        try {
            if (global.gc) {
                global.gc();
            } else {
                const before = process.memoryUsage().heapUsed / 1024 / 1024;
                require('v8').writeHeapSnapshot();
                const after = process.memoryUsage().heapUsed / 1024 / 1024;
            }
        } catch (err) {
            // Ignore
        }
    }, MEMORY_CLEANUP_INTERVAL);
}

function startStatusLog() {
    if (statusInterval) clearInterval(statusInterval);
    
    statusInterval = setInterval(() => {
        if (client) {
            log(`📊 Status: Online | Uptime: ${getUptime()} | RAM: ${getMemoryUsage()}`);
        }
    }, 600000); // A cada 10 minutos
}

function cleanup() {
    log('🛑 Encerrando...');
    if (afkInterval) clearInterval(afkInterval);
    if (memoryInterval) clearInterval(memoryInterval);
    if (statusInterval) clearInterval(statusInterval);
    if (client) {
        try {
            client.disconnect();
        } catch (e) {}
    }
    setTimeout(() => process.exit(0), 1000);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

process.on('uncaughtException', (err) => {
    log(`⚠️ Erro não tratado: ${err.message}`);
    scheduleReconnect();
});

process.on('unhandledRejection', (reason) => {
    log(`⚠️ Promise rejeitada: ${reason}`);
    scheduleReconnect();
});

// Memory warning
if (process.memoryUsage().heapUsed > 512 * 1024 * 1024) {
    log(`⚠️ AVISO: Uso alto de memória!`);
}

connectBot();