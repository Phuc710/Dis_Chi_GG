# Discord TTS Bot - Lệnh !gg

Bot Discord đọc text bằng giọng Google TTS trong voice channel.

## ✨ Tính năng

- **Lệnh !gg**: Đọc text trong voice channel
- **TTS tiếng Việt**: Sử dụng Google TTS với giọng tiếng Việt
- **Queue System**: Hỗ trợ nhiều lệnh liên tiếp, tự động xếp hàng và đọc tuần tự
- **Reactions**: Tự động thả ✅ (thành công) hoặc ❌ (thất bại)
- **Auto-leave**: Tự động rời voice channel sau 5 giây nếu không còn ai
- **Status**: Hiển thị "Đang chơi Lệnh !gg"

## 📋 Yêu cầu

- Node.js v16.9.0 trở lên
- FFmpeg (cần cài đặt trên hệ thống)

## 🚀 Cài đặt

1. **Clone repository**
```bash
git clone <repository-url>
cd dis_chi_gg
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Cấu hình .env**
File `.env` đã có sẵn với token bot của bạn:
```env
DISCORD_TOKEN=your_token_here
PREFIX=!
PORT=10000
```

## 🌐 Deploy lên Render

Bot đã được cấu hình sẵn để deploy lên Render với file `render.yaml`.

**Uptime Monitoring**:
- Endpoint `/ping`: `https://dis-chi-gg-g7lh.onrender.com/ping`

Dùng các endpoint này với UptimeRobot hoặc các dịch vụ monitoring khác để giữ bot luôn online.

## 🎮 Chạy Bot

**Development mode (auto-restart)**:
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

## 📖 Hướng dẫn sử dụng

1. **Vào voice channel** mà bạn muốn bot đọc
2. **Gửi lệnh** trong text channel:
   ```
   !gg Xin chào các bạn
   ```
3. Bot sẽ:
   - Join vào voice channel của bạn
   - Đọc text bằng giọng Google TTS
   - Thả ✅ nếu thành công, ❌ nếu thất bại
   - Tự động rời sau 5 giây nếu không còn ai

## ⚙️ Cấu hình Bot Discord

1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications)
2. Chọn application của bạn
3. Vào **Bot** → Bật các **Privileged Gateway Intents**:
   - ✅ Presence Intent
   - ✅ Server Members Intent
   - ✅ Message Content Intent
4. Vào **OAuth2** → **URL Generator**:
   - Scopes: `bot`
   - Bot Permissions: 
     - View Channels
     - Send Messages
     - Add Reactions
     - Connect
     - Speak

## 🛠️ Cấu trúc dự án

```
dis_chi_gg/
├── index.js          # File chính của bot
├── package.json      # Dependencies
├── .env             # Biến môi trường (token, prefix)
├── .gitignore       # Files bỏ qua khi commit
├── temp/            # Thư mục lưu file audio tạm (auto-generated)
└── README.md        # File này
```

## 📝 Lưu ý

- Bot chỉ hỗ trợ 1 lệnh duy nhất: `!gg`
- Text được đọc bằng giọng tiếng Việt
- File audio tạm sẽ tự động bị xóa sau khi phát
- Bot tự động rời voice channel sau 5 giây nếu không còn ai (trừ bot)

## 🐛 Xử lý lỗi thường gặp

**Bot không join voice channel**:
- Kiểm tra quyền Connect và Speak của bot
- Kiểm tra bạn đã vào voice channel chưa

**Không có âm thanh**:
- Kiểm tra FFmpeg đã cài đặt đúng chưa
- Kiểm tra quyền Speak của bot

**Bot crash**:
- Kiểm tra token trong file `.env`
- Kiểm tra Message Content Intent đã bật chưa

## 📄 License

DELL CÓ LUẬT