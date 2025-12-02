module.exports = {
    BOT_NAME: process.env.BOT_NAME || 'boton',
    SERVER_ADDRESS: process.env.SERVER_ADDRESS || 'Crias7.aternos.me',
    SERVER_PORT: parseInt(process.env.SERVER_PORT || '19132'),
    MICROSOFT_EMAIL: process.env.MICROSOFT_EMAIL,
    MICROSOFT_PASSWORD: process.env.MICROSOFT_PASSWORD,
    
    // Configurações de reconexão
    MAX_RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 20000, // 20 segundos
    
    // Configurações anti-AFK
    AFK_CHECK_INTERVAL: 60000, // 60 segundos
    
    // Logs
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};
