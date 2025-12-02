const bedrock = require('bedrock-protocol');

const BOT_NAME = 'boton';
const SERVER_HOST = 'Crias7.aternos.me';
const SERVER_PORT = 19132;

const MICROSOFT_EMAIL = process.env.MICROSOFT_EMAIL;
const MICROSOFT_PASSWORD = process.env.MICROSOFT_PASSWORD;

if (!MICROSOFT_EMAIL || !MICROSOFT_PASSWORD) {
    console.error('❌ Erro: MICROSOFT_EMAIL ou MICROSOFT_PASSWORD não configurados!');
    console.error('Configure os secrets no Replit antes de executar o bot.');
    process.exit(1);
}

let client = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 30000;
let serverIP = null;

function formatTime() {
    return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function log(message) {
    console.log(`[${formatTime()}] ${message}`);
}

async function connectBot() {
    log('🎮 Iniciando conexão com o servidor...');
    log(`📋 Nome do Bot: ${BOT_NAME}`);
    log(`🌐 Servidor: ${SERVER_HOST}:${SERVER_PORT}`);
    
    try {
        client = bedrock.createClient({
            host: SERVER_HOST,
            port: SERVER_PORT,
            username: MICROSOFT_EMAIL,
            offline: false,
            auth: 'microsoft',
            profilesFolder: './auth_cache'
        });

        client.on('connect', () => {
            log('✅ Conectado ao servidor!');
            reconnectAttempts = 0;
        });

        client.on('spawn', () => {
            log('🎮 Bot entrou no mundo!');
            log(`👤 Jogando como: ${BOT_NAME}`);
            
            startAntiAFK();
            startUptimePing();
        });

        client.on('start_game', (packet) => {
            if (packet.server_address) {
                serverIP = packet.server_address;
                log(`📡 IP do Servidor: ${serverIP}`);
            } else {
                log('📡 IP do Servidor: Não disponível');
            }
        });

        client.on('text', (packet) => {
            if (packet.type === 'chat' || packet.type === 'announcement') {
                log(`💬 Chat: ${packet.source_name || 'Sistema'}: ${packet.message}`);
            }
        });

        client.on('disconnect', (packet) => {
            log(`❌ Desconectado: ${packet.message || 'Motivo desconhecido'}`);
            scheduleReconnect();
        });

        client.on('error', (err) => {
            log(`⚠️ Erro: ${err.message}`);
            if (err.message.includes('timeout') || err.message.includes('connection')) {
                scheduleReconnect();
            }
        });

        client.on('close', () => {
            log('🔌 Conexão fechada');
            scheduleReconnect();
        });

    } catch (error) {
        log(`❌ Erro ao conectar: ${error.message}`);
        scheduleReconnect();
    }
}

function scheduleReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        log(`❌ Número máximo de tentativas (${MAX_RECONNECT_ATTEMPTS}) atingido.`);
        log('⏳ Aguardando 5 minutos antes de tentar novamente...');
        setTimeout(() => {
            reconnectAttempts = 0;
            connectBot();
        }, 300000);
        return;
    }

    reconnectAttempts++;
    log(`🔄 Reconectando em ${RECONNECT_DELAY / 1000}s... (Tentativa ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    
    setTimeout(() => {
        connectBot();
    }, RECONNECT_DELAY);
}

let afkInterval = null;
function startAntiAFK() {
    if (afkInterval) clearInterval(afkInterval);
    
    log('🔄 Sistema Anti-AFK ativado');
    
    afkInterval = setInterval(() => {
        if (client && client.status === 'connected') {
            try {
                client.queue('player_action', {
                    runtime_entity_id: 0n,
                    action: 'start_sneak',
                    position: { x: 0, y: 0, z: 0 },
                    result_position: { x: 0, y: 0, z: 0 },
                    face: 0
                });
                
                setTimeout(() => {
                    if (client && client.status === 'connected') {
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
                // Silently ignore movement errors
            }
        }
    }, 60000);
}

let uptimeInterval = null;
let startTime = Date.now();

function startUptimePing() {
    if (uptimeInterval) clearInterval(uptimeInterval);
    
    log('📡 Sistema de Uptime iniciado');
    
    uptimeInterval = setInterval(() => {
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        
        log(`⏱️ Uptime: ${hours}h ${minutes}m ${seconds}s | Status: Online`);
        
        if (serverIP) {
            log(`📡 Servidor IP: ${serverIP}`);
        }
        
    }, 300000);
}

function showStatus() {
    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     🎮 MINECRAFT BEDROCK AFK BOT 🎮        ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║  Bot: ${BOT_NAME.padEnd(36)}║`);
    console.log(`║  Servidor: ${SERVER_HOST.padEnd(31)}║`);
    console.log(`║  Porta: ${String(SERVER_PORT).padEnd(34)}║`);
    console.log(`║  Versão: Bedrock (Última)${' '.repeat(17)}║`);
    console.log('╠════════════════════════════════════════════╣');
    console.log('║  ✅ Anti-AFK: Ativo                        ║');
    console.log('║  ✅ Uptime Ping: Ativo                     ║');
    console.log('║  ✅ Auto-Reconexão: Ativo                  ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
}

process.on('SIGINT', () => {
    log('🛑 Encerrando bot...');
    if (afkInterval) clearInterval(afkInterval);
    if (uptimeInterval) clearInterval(uptimeInterval);
    if (client) {
        try {
            client.disconnect();
        } catch (e) {}
    }
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    log(`⚠️ Erro não tratado: ${err.message}`);
    scheduleReconnect();
});

process.on('unhandledRejection', (reason, promise) => {
    log(`⚠️ Promise rejeitada: ${reason}`);
});

showStatus();
connectBot();