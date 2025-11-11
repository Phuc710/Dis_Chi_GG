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
const connections = new Map(); // Lưu trữ voice connections
const autoLeaveTimers = new Map(); // Lưu trữ timers cho auto-leave
const queues = new Map(); // Lưu trữ queues cho mỗi guild
const isProcessing = new Map(); // Theo dõi guild đang xử lý

// Khi bot sẵn sàng
client.once('clientReady', () => {
    console.log(`✅ Bot đã đăng nhập: ${client.user.tag}`);
    
    // Đặt status cho bot
    client.user.setPresence({
        activities: [{ name: 'Lệnh !gg', type: ActivityType.Playing }],
        status: 'online',
    });
});

// Xử lý messages
client.on('messageCreate', async (message) => {
    // Bỏ qua tin nhắn từ bot
    if (message.author.bot) return;
    
    // Kiểm tra prefix
    if (!message.content.startsWith(PREFIX)) return;
    
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    // Xử lý lệnh !gg
    if (command === 'gg') {
        await handleGGCommand(message, args);
    }
});

// Hàm xử lý lệnh !gg (thêm vào queue)
async function handleGGCommand(message, args) {
    // Kiểm tra xem có text để đọc không
    if (args.length === 0) {
        return message.reply('❌ Vui lòng nhập text cần đọc! Ví dụ: `!gg Xin chào`');
    }
    
    const text = args.join(' ');
    
    // Kiểm tra xem user có trong voice channel không
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
        return message.reply('❌ Bạn cần vào voice channel trước!');
    }
    
    // Kiểm tra quyền của bot
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
        return message.reply('❌ Bot không có quyền vào hoặc nói trong voice channel!');
    }
    
    const guildId = message.guild.id;
    
    // Tạo queue cho guild nếu chưa có
    if (!queues.has(guildId)) {
        queues.set(guildId, []);
    }
    
    // Thêm request vào queue
    const queue = queues.get(guildId);
    queue.push({
        message,
        text,
        voiceChannel
    });
    
    console.log(`📝 Đã thêm vào queue (guild: ${guildId}), tổng: ${queue.length}`);
    
    // Xử lý queue nếu chưa đang xử lý
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
    
    // Lấy item đầu tiên trong queue
    const item = queue.shift();
    const { message, text, voiceChannel } = item;
    
    console.log(`🎵 Đang xử lý (guild: ${guildId}), còn ${queue.length} trong queue`);
    
    try {
        // Tạo file TTS
        const audioUrl = await generateTTS(text);
        
        // Join voice channel nếu chưa join
        let connection = connections.get(guildId);
        if (!connection || connection.state.status === VoiceConnectionStatus.Destroyed) {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guildId,
                adapterCreator: message.guild.voiceAdapterCreator,
            });
            
            connections.set(guildId, connection);
            
            // Đợi connection sẵn sàng
            await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
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
            // Thả reaction thành công
            message.react('✅').catch(console.error);
            
            // Xóa file tạm
            if (fs.existsSync(audioPath)) {
                fs.unlinkSync(audioPath);
            }
            
            // Xử lý item tiếp theo trong queue
            processQueue(guildId);
            
            // Kiểm tra và auto-leave sau 5s nếu queue rỗng
            if (queue.length === 0) {
                checkAndAutoLeave(guildId, voiceChannel);
            }
        });
        
        // Xử lý lỗi
        player.once('error', (error) => {
            console.error('Player error:', error);
            message.react('❌').catch(console.error);
            
            // Xóa file tạm nếu có lỗi
            if (fs.existsSync(audioPath)) {
                fs.unlinkSync(audioPath);
            }
            
            // Xử lý item tiếp theo
            processQueue(guildId);
        });
        
    } catch (error) {
        console.error('Error in processQueue:', error);
        message.react('❌').catch(console.error);
        
        // Xử lý item tiếp theo
        processQueue(guildId);
    }
}

// Hàm tạo TTS từ Google
async function generateTTS(text) {
    try {
        const url = googleTTS.getAudioUrl(text, {
            lang: 'vi', // Tiếng Việt
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
    
    // Tạo thư mục temp nếu chưa có
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
    // Xóa timer cũ nếu có
    if (autoLeaveTimers.has(guildId)) {
        clearTimeout(autoLeaveTimers.get(guildId));
    }
    
    // Tạo timer mới
    const timer = setTimeout(() => {
        // Kiểm tra số lượng members trong voice channel (trừ bot)
        const members = voiceChannel.members.filter(member => !member.user.bot);
        
        if (members.size === 0) {
            // Không còn ai, disconnect
            const connection = connections.get(guildId);
            if (connection) {
                connection.destroy();
                connections.delete(guildId);
                console.log(`🚪 Bot đã rời voice channel (guild: ${guildId})`);
            }
        }
        
        // Xóa timer
        autoLeaveTimers.delete(guildId);
    }, 5000); // 5 giây
    
    autoLeaveTimers.set(guildId, timer);
}

// Xử lý khi có người rời/vào voice channel
client.on('voiceStateUpdate', (oldState, newState) => {
    // Chỉ xử lý khi không phải bot
    if (newState.member.user.bot) return;
    
    const guildId = newState.guild.id;
    const connection = connections.get(guildId);
    
    if (!connection) return;
    
    // Lấy voice channel của bot
    const botVoiceChannel = newState.guild.members.me.voice.channel;
    if (!botVoiceChannel) return;
    
    // Kiểm tra nếu có người rời channel mà bot đang ở
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
