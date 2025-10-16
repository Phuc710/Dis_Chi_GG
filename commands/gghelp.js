const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'gghelp',
    aliases: [],
    usage: '!gghelp',
    description: 'Hướng dẫn sử dụng Chị GG TTS',

    async execute(message, args) {
        const embed = new EmbedBuilder()
            .setColor('#4285F4')
            .setTitle('🔊 Hướng Dẫn Sử Dụng Chị GG - Text to Speech')
            .setDescription('Bot đọc văn bản bằng Google Translate TTS')
            .addFields(
                {
                    name: '📖 Cách Dùng Cơ Bản',
                    value: '```!gg <nội dung>```Ví dụ: `!gg xin chào mọi người`',
                    inline: false
                },
                {
                    name: '🌍 Ngôn Ngữ',
                    value: 
                        '**Tiếng Việt (mặc định):**\n' +
                        '```!gg xin chào```\n' +
                        '**English:**\n' +
                        '```!gg hello everyone --en```',
                    inline: false
                },
                {
                    name: '🎭 Giọng Đọc',
                    value:
                        '**Nam (male):**\n' +
                        '```!gg xin chào --male```\n' +
                        '**Nữ (female - mặc định):**\n' +
                        '```!gg xin chào --female```',
                    inline: false
                },
                {
                    name: '⚡ Tốc Độ Đọc',
                    value:
                        '**Chậm (slow):**\n' +
                        '```!gg xin chào --slow```\n' +
                        '**Bình thường (mặc định):**\n' +
                        '```!gg xin chào```\n' +
                        '**Nhanh (fast):**\n' +
                        '```!gg xin chào --fast```',
                    inline: false
                },
                {
                    name: '🎯 Kết Hợp Tùy Chọn',
                    value:
                        '```!gg hello world --en --male --fast```' +
                        '```!gg xin chào --female --slow```' +
                        '```!gg chào bạn --male```',
                    inline: false
                },
                {
                    name: '📝 Lưu Ý',
                    value:
                        '• Tối đa **200 ký tự**/lần\n' +
                        '• Phải ở trong **voice channel**\n' +
                        '• Bot tự động rời khi không còn ai trong voice',
                    inline: false
                },
                {
                    name: '🔧 Lệnh',
                    value:
                        '`!gg` - Đọc văn bản\n' +
                        '`!gghelp` - Hiển thị menu này',
                    inline: false
                }
            )
            .setFooter({ 
                text: '💡 Tip: Dùng --en --male --fast để đọc tiếng Anh giọng nam nhanh' 
            })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};