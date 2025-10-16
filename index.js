require('dotenv').config();
const fs = require('fs');
const express = require('express');
const { Client, Collection, GatewayIntentBits, ActivityType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

const prefix = process.env.PREFIX || '!';

// Các status sẽ thay đổi theo chu kỳ
const statuses = [
    { name: '!gghelp || !gg', type: ActivityType.Listening },
    { name: 'Chị Google 🔊', type: ActivityType.Listening }
];

let currentStatus = 0;

client.on('ready', () => {
    console.log(`✅ BOT ONLINE: ${client.user.tag}`);
    console.log(`📊 Servers: ${client.guilds.cache.size}`);
    console.log(`👥 Users: ${client.users.cache.size}`);
    
    // Set status ban đầu
    updateStatus();
    
    // Đổi status mỗi 15 giây
    setInterval(() => {
        updateStatus();
    }, 15000);
});

function updateStatus() {
    const status = statuses[currentStatus];
    client.user.setPresence({
        activities: [{ 
            name: status.name, 
            type: status.type 
        }],
        status: 'online'
    });
    
    currentStatus = (currentStatus + 1) % statuses.length;
}

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName)
        || client.commands.find(cmd => cmd.aliases?.includes(commandName));

    if (!command) return;

    try {
        await command.execute(message, args);
    } catch (err) {
        console.error(err);
        message.reply('❌ Có lỗi xảy ra khi chạy lệnh này!');
    }
});

// Express server để Render giữ bot online
const app = express();
app.get('/ping', (req, res) => res.send('Bot is alive!'));
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));

client.login(process.env.DISCORD_TOKEN);