const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const http = require("http");

/* ===== HTTP SERVER (BẮT BUỘC CHO RENDER) ===== */
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("AI Baccarat Bot is running");
}).listen(PORT, () => {
  console.log("🌐 HTTP Server running on port", PORT);
});

/* ===== TELEGRAM TOKEN ===== */
const TOKEN = process.env.BOT_TOKEN || "8481700498:AAGtRCuY5u5xRBPJunwyr36pnzJmBtqhReA";
if (!TOKEN) {
  console.error("❌ BOT_TOKEN không tồn tại");
  process.exit(1);
}

/* ===== KHỞI TẠO BOT ===== */
const bot = new TelegramBot(TOKEN, { polling: true });
console.log("🤖 Telegram Bot started");

/* ===== TẠO NÚT C01 → C16 ===== */
function keyboardBan() {
  const rows = [];
  let row = [];

  for (let i = 1; i <= 16; i++) {
    row.push({ text: `C${i.toString().padStart(2, "0")}` });
    if (row.length === 4) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length) rows.push(row);

  return {
    reply_markup: {
      keyboard: rows,
      resize_keyboard: true
    }
  };
}

/* ===== START ===== */
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `🤖 *BOT FREE NÊN CẤM ĐÒI HỎI*

👉 *Bấm Dùng Tool Để Chọn Bàn Nhé!*`,
    {
      parse_mode: "Markdown",
      ...keyboardBan()
    }
  );
});

/* ===== CHỐNG SPAM ===== */
const userLock = new Set();

/* ===== CHỌN BÀN ===== */
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!/^C\d{2}$/i.test(text)) return;
  if (userLock.has(chatId)) return;

  userLock.add(chatId);
  const ban = text.toLowerCase();

  const loading = await bot.sendMessage(
    chatId,
    "⏳ *Đang Phân Tích Bàn...*",
    { parse_mode: "Markdown" }
  );

  try {
    const api = `https://bcrvip.onrender.com/api/ban/${ban}`;
    const res = await axios.get(api, { timeout: 8000 });
    const data = res.data;

    if (!data || !data.cau) throw new Error("API sai format");

    const cau = data.cau;
    const duDoan = cau.du_doan;
    const tiLe = cau.do_tin_cay;
    const mucDo = cau.muc_do_tin_cay;
    const cauName = cau["Cầu"];
    const chuoi = cau.ket_qua || "";

    let ketQua = "⏳ Chờ Kết Quả";
    if (chuoi.length > 0) {
      ketQua = chuoi.slice(-1) === duDoan ? "✅ Thắng" : "❌ Thua";
    }

    const textResult =
`🎯 *AI BACCARAT*
------------------------
🏷 *Bàn:* ${data.ban}
🧠 *Cầu:* ${cauName}
🤖 *Dự Đoán:* ${duDoan}
📊 *Tỉ Lệ:* ${tiLe}
🔥 *Độ Mạnh:* ${mucDo}
📌 *Kết Quả:* ${ketQua}
------------------------
🛠 Tool By: *Mai Mai*`;

    await bot.editMessageText(textResult, {
      chat_id: chatId,
      message_id: loading.message_id,
      parse_mode: "Markdown"
    });

  } catch (err) {
    console.error("API ERROR:", err.message);
    await bot.editMessageText(
      "❌ *API đang lỗi hoặc ngủ*\n⏳ *Thử lại sau*",
      {
        chat_id: chatId,
        message_id: loading.message_id,
        parse_mode: "Markdown"
      }
    );
  } finally {
    setTimeout(() => userLock.delete(chatId), 5000);
  }
});
