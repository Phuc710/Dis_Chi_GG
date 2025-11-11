require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const express = require('express');
const gtts = require('gtts');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const app = express();
const PORT = process.env.PORT || 3000;

// Store voice connections per guild
const voiceConnections = new Map();
const audioPlayers = new Map();

// Web server for uptime monitoring
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        bot: 'Chị Google - Discord TTS Bot',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.get('/ping', (req, res) => {
    res.json({
        message: 'pong',
        timestamp: new Date().toISOString(),
        latency: client.ws ? `${client.ws.ping}ms` : 'N/A'
    });
});

app.listen(PORT, () => {
    console.log(`🌐 Web server running on port ${PORT}`);
});

// Bot ready event
client.once('ready', () => {
    console.log(`✅ Chị Google is online as ${client.user.tag}`);
    console.log(`🤖 Serving ${client.guilds.cache.size} servers`);
    
    // Set bot status
    client.user.setActivity('!gg <text> để đọc text', { type: 'LISTENING' });
});

// Voice state update - auto disconnect when voice channel is empty
client.on('voiceStateUpdate', (oldState, newState) => {
    const guildId = newState.guild.id;
    const connection = voiceConnections.get(guildId);
    
    if (connection && connection.joinConfig.channelId) {
        const channel = client.channels.cache.get(connection.joinConfig.channelId);
        
        if (channel) {
            // Count non-bot members in the voice channel
            const nonBotMembers = channel.members.filter(member => !member.user.bot);
            
            // If no human members left, disconnect
            if (nonBotMembers.size === 0) {
                console.log(`🔇 Auto-disconnecting from empty voice channel in ${newState.guild.name}`);
                connection.destroy();
                voiceConnections.delete(guildId);
                audioPlayers.delete(guildId);
            }
        }
    }
});

// Function to create TTS audio file
async function createTTSFile(text, lang = 'vi') {
    return new Promise((resolve, reject) => {
        const tts = new gtts(text, lang);
        const filename = `tts_${Date.now()}.mp3`;
        const filepath = path.join(__dirname, filename);
        
        tts.save(filepath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(filepath);
            }
        });
    });
}

// Function to join voice channel and play TTS
async function playTTS(message, text) {
    const voiceChannel = message.member.voice.channel;
    
    if (!voiceChannel) {
        await message.reply('❌ Bạn cần vào voice channel trước!');
        return;
    }
    
    try {
        const guildId = message.guild.id;
        
        // Join voice channel
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guildId,
            adapterCreator: message.guild.voiceAdapterCreator,
        });
        
        voiceConnections.set(guildId, connection);
        
        // Wait for connection to be ready
        await new Promise((resolve, reject) => {
            connection.on(VoiceConnectionStatus.Ready, resolve);
            connection.on(VoiceConnectionStatus.Disconnected, reject);
            setTimeout(reject, 10000); // 10 second timeout
        });
        
        console.log(`🎤 Joined voice channel in ${message.guild.name}`);
        
        // Create TTS file
        const audioFile = await createTTSFile(text, 'vi');
        
        // Create audio player
        const player = createAudioPlayer();
        audioPlayers.set(guildId, player);
        
        // Create audio resource
        const resource = createAudioResource(audioFile);
        
        // Play audio
        player.play(resource);
        connection.subscribe(player);
        
        // Handle player events
        player.on(AudioPlayerStatus.Playing, () => {
            console.log(`🔊 Playing TTS: "${text.substring(0, 50)}..." in ${message.guild.name}`);
        });
        
        player.on(AudioPlayerStatus.Idle, () => {
            console.log(`✅ Finished playing TTS in ${message.guild.name}`);
            
            // Clean up audio file
            fs.unlink(audioFile, (err) => {
                if (err) console.error('Error deleting audio file:', err);
            });
        });
        
        player.on('error', (error) => {
            console.error('Audio player error:', error);
            
            // Clean up audio file
            fs.unlink(audioFile, (err) => {
                if (err) console.error('Error deleting audio file:', err);
            });
        });
        
        await message.react('✅');
        
    } catch (error) {
        console.error('❌ TTS error:', error);
        await message.react('❌');
        await message.reply('❌ Có lỗi xảy ra khi đọc text. Vui lòng thử lại!');
    }
}

// Message handler
client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Check if message starts with !gg
    if (!message.content.startsWith('!gg ')) return;
    
    // Extract text to read
    const textToRead = message.content.slice(4).trim();
    
    if (!textToRead) {
        await message.reply('❌ Vui lòng nhập text để đọc!\nVí dụ: `!gg Xin chào các bạn`');
        return;
    }
    
    // Limit text length
    if (textToRead.length > 500) {
        await message.reply('❌ Text quá dài! Tối đa 500 ký tự.');
        return;
    }
    
    console.log(`🗣️ TTS request: "${textToRead}" in ${message.guild.name} by ${message.author.username}`);
    
    // Play TTS
    await playTTS(message, textToRead);
});

// Error handling
client.on('error', console.error);

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down...');
    
    // Disconnect all voice connections
    voiceConnections.forEach((connection) => {
        connection.destroy();
    });
    
    client.destroy();
    process.exit(0);
});

// Login to Discord
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ DISCORD_TOKEN not found in environment variables!');
    process.exit(1);
}

client.login(token).catch(error => {
    console.error('❌ Failed to login:', error);
    process.exit(1);
});
