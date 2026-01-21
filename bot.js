const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

/* ===== TOKEN (Render ENV) ===== */
const TOKEN = process.env.BOT_TOKEN || "8481700498:AAGtRCuY5u5xRBPJunwyr36pnzJmBtqhReA";

/* ===== KHỞI TẠO BOT ===== */
const bot = new TelegramBot(TOKEN, { polling: true });

console.log("🤖 AI Baccarat Bot đang chạy...");

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

/* ===== XỬ LÝ CHỌN BÀN ===== */
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!/^C\d{2}$/i.test(text)) return;

  const ban = text.toLowerCase();

  const loading = await bot.sendMessage(
    chatId,
    "⏳ *Đang Phân Tích Bàn...*",
    { parse_mode: "Markdown" }
  );

  try {
    const api = `https://bcrvip.onrender.com/api/ban/${ban}`;
    const res = await axios.get(api);
    const data = res.data;
    const cau = data.cau;

    const duDoan = cau.du_doan;
    const tiLe = cau.do_tin_cay;
    const mucDo = cau.muc_do_tin_cay;
    const cauName = cau["Cầu"];
    const chuoi = cau.ket_qua;

    const last = chuoi.slice(-1);
    const ketQua = last === duDoan ? "✅ Thắng" : "❌ Thua";

    const resultText =
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

    await bot.editMessageText(resultText, {
      chat_id: chatId,
      message_id: loading.message_id,
      parse_mode: "Markdown"
    });

    /* ===== PHÂN TÍCH TIẾP ===== */
    setTimeout(async () => {
      const loading2 = await bot.sendMessage(
        chatId,
        "🤖 *AI Đang Phân Tích...*",
        { parse_mode: "Markdown" }
      );

      const res2 = await axios.get(api);
      const c2 = res2.data.cau;

      const last2 = c2.ket_qua.slice(-1);
      const ketQua2 = last2 === c2.du_doan ? "✅ Thắng" : "❌ Thua";

      const finalText =
`🎯 *AI BACCARAT*
------------------------
🏷 *Bàn:* ${text.toUpperCase()}
🧠 *Cầu:* ${c2["Cầu"]}
🤖 *Dự Đoán:* ${c2.du_doan}
📊 *Tỉ Lệ:* ${c2.do_tin_cay}
🔥 *Độ Mạnh:* ${c2.muc_do_tin_cay}
📌 *Kết Quả:* ${ketQua2}
------------------------
🛠 Tool By: *Mai Mai*`;

      await bot.editMessageText(finalText, {
        chat_id: chatId,
        message_id: loading2.message_id,
        parse_mode: "Markdown"
      });

    }, 4000);

  } catch (err) {
    await bot.editMessageText("❌ *Lỗi API – thử lại sau*", {
      chat_id: chatId,
      message_id: loading.message_id,
      parse_mode: "Markdown"
    });
  }
});
