# Chị Google - Discord TTS Bot

A Discord bot that reads text aloud in voice channels using Text-to-Speech (TTS) technology, just like Google Assistant!

## Features

- 🗣️ **Text-to-Speech**: Use `!gg <text>` to make the bot read text in Vietnamese voice
- 🎤 **Voice Channel Join**: Automatically joins your voice channel to speak
- 🔇 **Auto Disconnect**: Automatically leaves when voice channel is empty
- 🌐 **Multi-Server**: Works independently across multiple Discord servers
- 📊 **Uptime Monitoring**: Built-in web server with `/ping` endpoint
- ✅ **Smart Reactions**: Reacts with ✅ for success, ❌ for errors
- 🚀 **Render Ready**: Configured for easy deployment on Render

## Commands

### `!gg <text to read>`
Bot joins your voice channel and reads the text aloud in Vietnamese.

**Examples:**
```
!gg Xin chào các bạn
!gg Hôm nay trời đẹp quá
!gg Bot này rất hay đúng không
```

**Requirements:**
- You must be in a voice channel
- Text limit: 500 characters
- Language: Vietnamese (vi)

## Setup Instructions

### 1. Discord Bot Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to "Bot" section and click "Reset Token"
4. Copy the token (you'll need this for deployment)
5. Enable "Message Content Intent" in Bot settings
6. Go to "OAuth2" → "URL Generator"
7. Select scopes: `bot`
8. Select permissions: `Send Messages`, `Add Reactions`, `Connect`, `Speak`, `Use Voice Activity`
9. Copy the generated URL and invite the bot to your server

### 2. Environment Variables
Create a `.env` file with:
```env
DISCORD_TOKEN=your_discord_bot_token_here
PORT=3000
```

### 3. Local Development
```bash
npm install
npm start
```

### 4. Deploy to Render
1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Render will automatically detect the `render.yaml` configuration
6. Add Environment Variable:
   - Key: `DISCORD_TOKEN`
   - Value: (your bot token from step 1)
7. Click "Deploy"

## Usage

1. Invite the bot to your Discord server
2. Join a voice channel
3. Use `!gg <text>` in any text channel
4. Bot will join your voice channel and read the text
5. Bot reacts with ✅ for successful TTS, ❌ for errors

## Voice Channel Management

- Bot automatically joins your current voice channel
- Bot automatically disconnects when no users are present
- Each server operates independently
- Supports multiple servers simultaneously

## Monitoring

After deployment, you can monitor your bot:
- **Status Page**: `https://your-app.onrender.com/`
- **Health Check**: `https://your-app.onrender.com/ping`

## Technical Details

- **Framework**: Discord.js v14
- **TTS Engine**: Google Text-to-Speech (gtts)
- **Voice**: @discordjs/voice
- **Web Server**: Express.js
- **Deployment**: Render with automatic builds
- **Node Version**: 18+
- **Language**: Vietnamese (vi)

## File Structure
```
├── index.js          # Main bot code
├── package.json      # Dependencies and scripts
├── render.yaml       # Render deployment config
├── README.md         # This file
└── .env.example      # Environment variables template
```

## Dependencies

- `discord.js`: Discord API wrapper
- `@discordjs/voice`: Voice connection handling
- `@discordjs/opus`: Audio encoding
- `gtts`: Google Text-to-Speech
- `express`: Web server for uptime monitoring
- `fluent-ffmpeg`: Audio processing
- `prism-media`: Audio streaming
- `dotenv`: Environment variable management

## Limitations

- Text limit: 500 characters per message
- Language: Vietnamese only
- Requires voice channel permissions
- Audio files are temporarily stored and auto-deleted

## Support

If you encounter any issues:
1. Check that your Discord token is correct
2. Ensure the bot has voice permissions in your server
3. Verify that Message Content Intent is enabled
4. Make sure you're in a voice channel when using `!gg`
5. Check the logs in Render dashboard for errors

## License

MIT License - Feel free to modify and distribute!

## 📝 Environment Variables

| Variable | Mô tả | Mặc định |
|----------|-------|----------|
| `DISCORD_TOKEN` | Discord bot token (bắt buộc) | - |
| `PREFIX` | Prefix cho lệnh | `!` |
| `PORT` | Port cho web server | `10000` |

## 🛠️ Tech Stack

- **discord.js v14**: Discord API wrapper
- **@discordjs/voice**: Voice channel support
- **google-it**: Google search functionality
- **express**: Web server cho health checks
- **dotenv**: Environment variable management

## 📊 Multi-server Support

Bot tự động quản lý riêng biệt cho mỗi server:
- Voice connections riêng cho mỗi guild
- Commands xử lý độc lập
- Không có xung đột giữa các server

## 🐛 Troubleshooting

### Bot không phản hồi lệnh

- Kiểm tra bot có quyền `Send Messages` và `Embed Links`
- Kiểm tra **Message Content Intent** đã bật trong Developer Portal
- Kiểm tra prefix đúng (mặc định `!`)

### Bot không tự động disconnect

- Kiểm tra bot có quyền `Connect` và `View Channel`
- Kiểm tra **Voice State Intent** đã bật

### Lỗi khi search Google

- Kiểm tra kết nối internet
- Google có thể rate-limit, thử lại sau vài giây

## 📄 License

ISC

## 👤 Support

Nếu có vấn đề, tạo issue trên GitHub repository.
