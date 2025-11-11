# Discord Google Search Bot

Discord bot với chức năng tìm kiếm Google và tự động rời voice channel khi không có người.

## ✨ Tính năng

- 🔍 **Tìm kiếm Google**: Sử dụng lệnh `!gg <text>` để tìm kiếm
- ✅ **Phản hồi trực quan**: Bot react ✅ khi thành công, ❌ khi lỗi
- 🔊 **Auto-disconnect**: Tự động rời voice channel khi không còn ai
- 🌐 **Multi-server**: Hoạt động độc lập trên nhiều server
- 📊 **Uptime monitoring**: Endpoint `/ping` để theo dõi trạng thái

## 🚀 Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` với nội dung:

```env
DISCORD_TOKEN=your_discord_bot_token_here
PREFIX=!
PORT=10000
```

### 3. Lấy Discord Bot Token

1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications)
2. Tạo New Application
3. Vào tab **Bot** → Reset Token → Copy token
4. Bật các Privileged Gateway Intents:
   - ✅ Message Content Intent
   - ✅ Server Members Intent
   - ✅ Presence Intent
5. Vào tab **OAuth2** → URL Generator
6. Chọn scopes: `bot`
7. Chọn permissions: 
   - Send Messages
   - Embed Links
   - Add Reactions
   - Connect (voice)
   - Speak (voice)
8. Copy URL và mời bot vào server

### 4. Chạy bot locally

```bash
npm start
```

## 📦 Deploy lên Render

### Cách 1: Deploy qua GitHub

1. Push code lên GitHub repository
2. Truy cập [Render Dashboard](https://dashboard.render.com/)
3. Click **New** → **Web Service**
4. Connect GitHub repository của bạn
5. Render sẽ tự động phát hiện `render.yaml`
6. Thêm environment variable `DISCORD_TOKEN` trong Render dashboard
7. Click **Deploy**

### Cách 2: Deploy trực tiếp

1. Cài đặt Render CLI:
```bash
npm install -g render-cli
```

2. Login vào Render:
```bash
render login
```

3. Deploy:
```bash
render deploy
```

## 🎮 Sử dụng

### Lệnh `!gg`

Tìm kiếm trên Google:

```
!gg discord bot tutorial
!gg javascript async await
!gg best pizza near me
```

Bot sẽ trả về top 5 kết quả tìm kiếm với:
- Tiêu đề
- Mô tả ngắn
- Link trực tiếp

### Auto-disconnect

Bot sẽ tự động rời khỏi voice channel khi:
- Không còn người dùng nào trong channel (chỉ còn bot)
- Được check mỗi khi có người rời channel

## 🔧 API Endpoints

### GET /ping

Health check endpoint cho uptime monitoring:

```json
{
  "status": "online",
  "uptime": 12345.67,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /

Simple status page

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
