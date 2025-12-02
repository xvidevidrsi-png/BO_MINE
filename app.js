require('dotenv').config();
const bedrock = require('bedrock-protocol');

const BOT_NAME = process.env.BOT_NAME || 'boton';
const REAL_SERVER = process.env.SERVER_ADDRESS || 'Crias7.aternos.me';
const REAL_PORT = parseInt(process.env.SERVER_PORT || '19132');
const MICROSOFT_EMAIL = process.env.MICROSOFT_EMAIL;
const MICROSOFT_PASSWORD = process.env.MICROSOFT_PASSWORD;

const TEST_SERVERS = [
    { host: 'play.cubecraft.net', port: 19132 },
    { host: 'play.galaxite.net', port: 19132 },
];

if (!MICROSOFT_EMAIL || !MICROSOFT_PASSWORD) {
    console.log('[BOT] >>> ERRO: Configure MICROSOFT_EMAIL e MICROSOFT_PASSWORD');
    process.exit(1);
}

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
    
    log(`${'-'.repeat(50)}`);
    if (testMode) {
        log(`TESTANDO servidor: ${host}:${p}`);
    } else {
        log(`CONECTANDO ao seu servidor: ${host}:${p}`);
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
            profilesFolder: './auth_cache',
            password: MICROSOFT_PASSWORD
        });

        client.on('connect', () => {
            log('✓ TCP CONECTADO');
        });

        client.on('start_game', () => {
            isInGame = true;
            if (testMode) {
                log('========================================');
                log('✓ TESTE BEM-SUCEDIDO - Entrando no servidor');
                log('========================================');
                testMode = false;
                setTimeout(() => {
                    client.disconnect();
                    log('Desconectando do servidor de teste...');
                    setTimeout(() => connectBot(REAL_SERVER, REAL_PORT), 2000);
                }, 3000);
            } else {
                log('========================================');
                log('✓✓✓ BOT ENTROU NO SEU SERVIDOR! ✓✓✓');
                log('========================================');
                log('Status: JOGANDO AGORA');
                log('========================================');
            }
            reconnectAttempts = 0;
            startAntiAFK();
        });

        client.on('spawn', () => {
            if (!isInGame) {
                isInGame = true;
                if (testMode) {
                    log('========================================');
                    log('✓ TESTE BEM-SUCEDIDO - Entrando no servidor');
                    log('========================================');
                    testMode = false;
                    setTimeout(() => {
                        client.disconnect();
                        log('Desconectando do servidor de teste...');
                        setTimeout(() => connectBot(REAL_SERVER, REAL_PORT), 2000);
                    }, 3000);
                } else {
                    log('========================================');
                    log('✓✓✓ BOT ENTROU NO SEU SERVIDOR! ✓✓✓');
                    log('========================================');
                    log('Status: JOGANDO AGORA');
                    log('========================================');
                }
                reconnectAttempts = 0;
                startAntiAFK();
            }
        });

        client.on('disconnect', () => {
            isInGame = false;
            log('❌ DESCONECTADO');
            scheduleReconnect();
        });

        client.on('error', (err) => {
            log('❌ ERRO: ' + err.message);
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

function scheduleReconnect() {
    if (reconnectAttempts >= MAX_ATTEMPTS) {
        log(`${'-'.repeat(50)}`);
        log('⚠ Maximo de tentativas atingido');
        log('Esperando 3 minutos...');
        log(`${'-'.repeat(50)}`);
        setTimeout(() => {
            reconnectAttempts = 0;
            testIndex = 0;
            testMode = true;
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
        try {
            client.disconnect();
        } catch (e) {}
    }
    process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('uncaughtException', (err) => {
    log('Erro: ' + err.message);
    scheduleReconnect();
});

log('🤖 INICIANDO BOT');
log('1. Vai tentar entrar em servidor de teste');
log('2. Se conseguir, desconecta e entra no seu servidor');
connectBot();
