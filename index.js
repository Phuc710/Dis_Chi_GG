require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState
} = require('@discordjs/voice');
const googleTTS = require('google-tts-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Tạo client Discord với intents cần thiết
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

const PREFIX = process.env.PREFIX || '!';
const connections = new Map();
const autoLeaveTimers = new Map();
const queues = new Map();
const isProcessing = new Map();

// Khi bot sẵn sàng
client.once('ready', () => {
    console.log(`✅ Bot đã đăng nhập: ${client.user.tag}`);
    
    client.user.setPresence({
        activities: [{ name: 'Lệnh !gg', type: ActivityType.Playing }],
        status: 'online',
    });
});

// Xử lý messages
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;
    
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    if (command === 'gg') {
        await handleGGCommand(message, args);
    }
});

// Hàm xử lý lệnh !gg
async function handleGGCommand(message, args) {
    if (args.length === 0) {
        return message.reply('❌ Vui lòng nhập text cần đọc! Ví dụ: `!gg Xin chào`');
    }
    
    const text = args.join(' ');
    const voiceChannel = message.member.voice.channel;
    
    if (!voiceChannel) {
        return message.reply('❌ Bạn cần vào voice channel trước!');
    }
    
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
        return message.reply('❌ Bot không có quyền vào hoặc nói trong voice channel!');
    }
    
    const guildId = message.guild.id;
    
    if (!queues.has(guildId)) {
        queues.set(guildId, []);
    }
    
    const queue = queues.get(guildId);
    queue.push({ message, text, voiceChannel });
    
    console.log(`📝 Đã thêm vào queue (guild: ${guildId}), tổng: ${queue.length}`);
    
    if (!isProcessing.get(guildId)) {
        processQueue(guildId);
    }
}

// Hàm xử lý queue
async function processQueue(guildId) {
    const queue = queues.get(guildId);
    
    if (!queue || queue.length === 0) {
        isProcessing.set(guildId, false);
        return;
    }
    
    isProcessing.set(guildId, true);
    
    const item = queue.shift();
    const { message, text, voiceChannel } = item;
    
    console.log(`🎵 Đang xử lý (guild: ${guildId}), còn ${queue.length} trong queue`);
    
    try {
        // Tạo file TTS
        const audioUrl = await generateTTS(text);
        
        // Join voice channel
        let connection = connections.get(guildId);
        if (!connection || connection.state.status === VoiceConnectionStatus.Destroyed) {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guildId,
                adapterCreator: message.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false,
            });
            
            connections.set(guildId, connection);
            
            // Xử lý lỗi connection
            connection.on('error', error => {
                console.error('❌ Voice connection error:', error);
            });
            
            connection.on(VoiceConnectionStatus.Disconnected, async () => {
                try {
                    await Promise.race([
                        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                    ]);
                } catch (error) {
                    connection.destroy();
                    connections.delete(guildId);
                }
            });
            
            // Đợi connection sẵn sàng
            try {
                await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
            } catch (error) {
                console.error('❌ Connection timeout:', error);
                connection.destroy();
                connections.delete(guildId);
                throw new Error('Không thể kết nối voice channel');
            }
        }
        
        // Tải audio file
        const audioPath = await downloadAudio(audioUrl);
        
        // Phát audio
        const player = createAudioPlayer();
        const resource = createAudioResource(audioPath);
        
        connection.subscribe(player);
        player.play(resource);
        
        // Xử lý khi phát xong
        player.once(AudioPlayerStatus.Idle, () => {
            message.react('✅').catch(console.error);
            
            if (fs.existsSync(audioPath)) {
                fs.unlinkSync(audioPath);
            }
            
            processQueue(guildId);
            
            if (queue.length === 0) {
                checkAndAutoLeave(guildId, voiceChannel);
            }
        });
        
        // Xử lý lỗi
        player.once('error', (error) => {
            console.error('❌ Player error:', error);
            message.react('❌').catch(console.error);
            
            if (fs.existsSync(audioPath)) {
                fs.unlinkSync(audioPath);
            }
            
            processQueue(guildId);
        });
        
    } catch (error) {
        console.error('❌ Error in processQueue:', error);
        message.react('❌').catch(console.error);
        processQueue(guildId);
    }
}

// Hàm tạo TTS từ Google
async function generateTTS(text) {
    try {
        const url = googleTTS.getAudioUrl(text, {
            lang: 'vi',
            slow: false,
            host: 'https://translate.google.com',
        });
        return url;
    } catch (error) {
        console.error('Error generating TTS:', error);
        throw error;
    }
}

// Hàm download audio
async function downloadAudio(url) {
    const tempDir = path.join(__dirname, 'temp');
    
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }
    
    const fileName = `tts_${Date.now()}.mp3`;
    const filePath = path.join(tempDir, fileName);
    
    const response = await axios.get(url, {
        responseType: 'arraybuffer'
    });
    
    fs.writeFileSync(filePath, response.data);
    
    return filePath;
}

// Hàm kiểm tra và auto-leave
function checkAndAutoLeave(guildId, voiceChannel) {
    if (autoLeaveTimers.has(guildId)) {
        clearTimeout(autoLeaveTimers.get(guildId));
    }
    
    const timer = setTimeout(() => {
        const members = voiceChannel.members.filter(member => !member.user.bot);
        
        if (members.size === 0) {
            const connection = connections.get(guildId);
            if (connection) {
                connection.destroy();
                connections.delete(guildId);
                console.log(`🚪 Bot đã rời voice channel (guild: ${guildId})`);
            }
        }
        
        autoLeaveTimers.delete(guildId);
    }, 5000);
    
    autoLeaveTimers.set(guildId, timer);
}

// Xử lý khi có người rời/vào voice channel
client.on('voiceStateUpdate', (oldState, newState) => {
    if (newState.member.user.bot) return;
    
    const guildId = newState.guild.id;
    const connection = connections.get(guildId);
    
    if (!connection) return;
    
    const botVoiceChannel = newState.guild.members.me.voice.channel;
    if (!botVoiceChannel) return;
    
    if (oldState.channelId === botVoiceChannel.id && newState.channelId !== botVoiceChannel.id) {
        checkAndAutoLeave(guildId, botVoiceChannel);
    }
});

// Tạo HTTP server cho Render health check
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'online',
            bot: client.user ? client.user.tag : 'connecting...',
            uptime: process.uptime()
        }));
    } else if (req.url === '/ping') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'success',
            message: 'pong',
            timestamp: new Date().toISOString(),
            bot: client.user ? client.user.tag : 'connecting...'
        }));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`🌐 HTTP server đang chạy trên port ${PORT}`);
});

// Đăng nhập bot
client.login(process.env.DISCORD_TOKEN);