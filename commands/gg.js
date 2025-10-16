const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
    getVoiceConnection
} = require('@discordjs/voice');
const { request } = require('undici');

const MAX_TEXT_LENGTH = 200;
const TTS_URL = 'https://translate.googleapis.com/translate_tts';

async function getTTSStream(text) {
    const params = new URLSearchParams({
        client: 'tw',
        tl: 'vi',
        ie: 'UTF-8',
        q: text
    });

    const { body, statusCode } = await request(`${TTS_URL}?${params}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        maxRedirections: 5
    });

    if (statusCode !== 200) {
        body?.resume?.();
        throw new Error(`TTS failed: ${statusCode}`);
    }

    return body;
}

module.exports = {
    name: 'gg',
    aliases: [],
    description: 'Chị Google ',

    async execute(message, args) {
        const voiceChannel = message.member?.voice?.channel;
        
        if (!args.length) {
            return message.reply('❌ Vui lòng nhập nội dung! Ví dụ: `!gg xin chào`')
                .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
        }

        const text = args.join(' ').trim();

        if (text.length > MAX_TEXT_LENGTH) {
            return message.reply(`❌ Quá dài! Tối đa ${MAX_TEXT_LENGTH} ký tự`)
                .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
        }

        if (!voiceChannel) {
            return message.reply('❌ Bạn cần ở trong voice channel!')
                .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
        }

        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions?.has('Connect') || !permissions?.has('Speak')) {
            return message.reply('❌ Bot không có quyền vào voice channel!')
                .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
        }

        let connection = getVoiceConnection(voiceChannel.guild.id);
        
        if (!connection || connection.joinConfig.channelId !== voiceChannel.id) {
            if (connection) connection.destroy();
            
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: true,
                selfMute: false
            });
        }

        const player = createAudioPlayer();
        connection.subscribe(player);

        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 30000);

            const stream = await getTTSStream(text);
            const resource = createAudioResource(stream, { 
                inlineVolume: false
            });

            player.play(resource);
            
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Playback timeout'));
                }, 30_000);
                
                player.once(AudioPlayerStatus.Idle, () => {
                    clearTimeout(timeout);
                    resolve();
                });
                
                player.once('error', err => {
                    clearTimeout(timeout);
                    reject(err);
                });
            });

            await message.react('✅').catch(() => {});

        } catch (error) {
            console.error('[TTS Error]', error.message);
            await message.react('❌').catch(() => {});
        }

        // Auto disconnect khi không còn ai
        const checkEmpty = setInterval(() => {
            const vc = message.guild?.channels.cache.get(voiceChannel.id);
            if (!vc || vc.members.filter(m => !m.user.bot).size === 0) {
                clearInterval(checkEmpty);
                const conn = getVoiceConnection(voiceChannel.guild.id);
                if (conn) conn.destroy();
            }
        }, 5000);
    }
};