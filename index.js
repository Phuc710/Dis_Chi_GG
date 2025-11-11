require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const express = require('express');
const googleIt = require('google-it');

// Initialize Express for uptime monitoring
const app = express();
const PORT = process.env.PORT || 10000;

// Health check endpoint
app.get('/ping', (req, res) => {
  res.status(200).json({
    status: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.status(200).send('Discord Bot is running!');
});

// Start Express server
app.listen(PORT, () => {
  console.log(`✅ Web server running on port ${PORT}`);
});

// Initialize Discord bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const PREFIX = process.env.PREFIX || '!';

// Track voice connections per guild
const voiceConnections = new Map();

// Check voice channel for empty status
function checkVoiceChannel(guildId) {
  const connection = getVoiceConnection(guildId);
  if (!connection) return;

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  const voiceChannel = guild.channels.cache.get(connection.joinConfig.channelId);
  if (!voiceChannel) return;

  // Count non-bot members in voice channel
  const humanMembers = voiceChannel.members.filter(member => !member.user.bot);
  
  if (humanMembers.size === 0) {
    console.log(`🚪 No humans left in voice channel, disconnecting from ${guild.name}`);
    connection.destroy();
    voiceConnections.delete(guildId);
  }
}

// Monitor voice state updates
client.on('voiceStateUpdate', (oldState, newState) => {
  // Check if someone left a channel that the bot is in
  if (oldState.channel && oldState.guild.members.me.voice.channel?.id === oldState.channel.id) {
    setTimeout(() => checkVoiceChannel(oldState.guild.id), 1000);
  }
});

client.on('ready', () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} servers`);
  client.user.setActivity('!gg <text>', { type: 'LISTENING' });
});

client.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Ignore messages without prefix
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // !gg command - Google search
  if (command === 'gg') {
    if (args.length === 0) {
      return message.reply('❌ Vui lòng nhập từ khóa tìm kiếm! Ví dụ: `!gg discord bot`');
    }

    const searchQuery = args.join(' ');
    
    try {
      // Show typing indicator
      await message.channel.sendTyping();
      
      console.log(`🔍 Searching Google for: "${searchQuery}" in server: ${message.guild.name}`);
      
      // Perform Google search
      const results = await googleIt({ query: searchQuery, limit: 5 });
      
      if (!results || results.length === 0) {
        await message.reply('❌ Không tìm thấy kết quả nào!');
        return;
      }

      // Create embed with results
      const embed = new EmbedBuilder()
        .setColor('#4285F4')
        .setTitle(`🔍 Kết quả tìm kiếm: "${searchQuery}"`)
        .setTimestamp()
        .setFooter({ text: `Yêu cầu bởi ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

      // Add up to 5 results
      results.slice(0, 5).forEach((result, index) => {
        embed.addFields({
          name: `${index + 1}. ${result.title || 'No title'}`,
          value: `${result.snippet || 'No description'}\n[🔗 Link](${result.link})`,
          inline: false
        });
      });

      await message.reply({ embeds: [embed] });
      
      // React with success
      await message.react('✅');
      console.log(`✅ Search completed successfully for: "${searchQuery}"`);
      
    } catch (error) {
      console.error('❌ Google search error:', error);
      await message.reply('❌ Có lỗi xảy ra khi tìm kiếm trên Google!');
      
      // React with error
      try {
        await message.react('❌');
      } catch (reactError) {
        console.error('Failed to react:', reactError);
      }
    }
  }
});

// Error handling
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
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
