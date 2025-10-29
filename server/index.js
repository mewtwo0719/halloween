import cors from "cors";
import express from "express";
import fs from "fs";
import http from "http";
import path from "path";
import QRCode from "qrcode";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});

// ------------------------------
// 🧩 Static Game Data
// ------------------------------
const RECOVERY_CODE_VALUES = [
  "4821", //iz maila broj 12.
  "9153", //iz maila broj 7. Bilješke Istraživanja [notes@research.aurora-corp.com](mailto:notes@research.aurora-corp.com)
  "6158", //kad se zavrse QR kodovi
  "2049",
  "7385",
  "1593",
  "8264",
  "4710",
  "5937",
  "0682",
];
const QR_CODE_VALUES = [
  "R3C0V3R",
  "K3YF1ND3",
  "L0CKB0X1",
  "C0D3HUN7",
  "UNL0CKM3",
  "S3CR3T42",
  "P4ZZL3X1",
  "D4T4L0CK",
  "F1L3K3Y7",
  "CLU3S3EK",
  "TR34SUR3",
  "G4M3C0D3",
  "QRC0D3ME",
  "H4CKTH1S",
  "S0LV3M31",
];
const FINAL_HIDDEN_CODE = "6158"; // example, this will be revealed after all QR codes scanned

// ------------------------------
// 🧩 Game State
// ------------------------------
const SAVE_FILE = "./gameState.json";

let gameState = {
  timestamp: new Date().toISOString(),
  playerCount: 0,
  recoveryCodes: RECOVERY_CODE_VALUES.map((c) => ({ code: c, entered: false })),
  qrCodes: QR_CODE_VALUES.map((c) => ({ code: c, scanned: false })),
};

// Load previous state if exists
if (fs.existsSync(SAVE_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(SAVE_FILE, "utf8"));
    if (data.recoveryCodes && data.qrCodes) {
      gameState.recoveryCodes = data.recoveryCodes;
      gameState.qrCodes = data.qrCodes;
    }
    console.log("✅ Loaded saved game state.");
  } catch (err) {
    console.warn("⚠️ Could not load saved game state:", err);
  }
}

// ------------------------------
// 💾 Autosave every 10s
// ------------------------------
setInterval(() => {
  gameState.timestamp = new Date().toISOString();
  fs.writeFileSync(SAVE_FILE, JSON.stringify(gameState, null, 2));
}, 10000);

// ------------------------------
// ⚡ Socket.IO
// ------------------------------
io.on("connection", (socket) => {
  console.log("🟢 Player connected:", socket.id);
  gameState.playerCount++;
  socket.emit("game-state", gameState);

  socket.on("disconnect", () => {
    console.log("🔴 Player disconnected:", socket.id);
    gameState.playerCount = Math.max(0, gameState.playerCount - 1);
    broadcastState();
  });

  // Submit recovery code
  socket.on("submit-recovery-code", (code) => {
    const found = gameState.recoveryCodes.find((c) => c.code === code);
    if (!found) {
      socket.emit("recovery-code-status", { code, success: false });
      return;
    }
    if (!found.entered) found.entered = true;
    socket.emit("recovery-code-status", { code, success: true });
    broadcastState();
  });

  // Scan QR code
  socket.on("scan-qr", (code) => {
    const found = gameState.qrCodes.find((c) => c.code === code);
    if (!found) {
      socket.emit("qr-scan-status", { code, success: false });
      return;
    }
    if (!found.scanned) found.scanned = true;
    socket.emit("qr-scan-status", { code, success: true });
    broadcastState();
  });

  // Request current state manually
  socket.on("request-game-state", () => {
    socket.emit("game-state", gameState);
  });

  socket.on("all-qr-scanned", ({ finalCode }) => {
    console.log("All QR codes scanned! Hidden code is:", finalCode);
    // you can store this in state and show input for recovery screen
  });
});

// ------------------------------
// 🌍 REST API
// ------------------------------
app.get("/state", (req, res) => res.json(gameState));

app.post("/reset", (req, res) => {
  gameState = {
    timestamp: new Date().toISOString(),
    playerCount: 0,
    recoveryCodes: RECOVERY_CODE_VALUES.map((c) => ({
      code: c,
      entered: false,
    })),
    qrCodes: QR_CODE_VALUES.map((c) => ({ code: c, scanned: false })),
  };
  broadcastState();
  fs.writeFileSync(SAVE_FILE, JSON.stringify(gameState, null, 2));
  res.json({ ok: true });
});

// Recovery codes
app.get("/recovery-codes", (req, res) =>
  res.json({ recoveryCodes: gameState.recoveryCodes })
);

app.post("/submit-recovery-code", (req, res) => {
  const { code } = req.body;
  const found = gameState.recoveryCodes.find((c) => c.code === code);
  if (!found)
    return res.json({
      ok: false,
      success: false,
      message: "Invalid code",
      recoveryCodes: gameState.recoveryCodes,
    });
  if (!found.entered) found.entered = true;
  broadcastState();
  res.json({ ok: true, success: true, recoveryCodes: gameState.recoveryCodes });
});

// QR codes
app.get("/qr-codes", (req, res) => res.json({ qrCodes: gameState.qrCodes }));

app.post("/submit-qr-code", (req, res) => {
  const { code } = req.body;
  const found = gameState.qrCodes.find((c) => c.code === code.toUpperCase());
  if (!found)
    return res.json({
      ok: false,
      success: false,
      message: "Invalid code",
      qrCodes: gameState.qrCodes,
    });
  if (!found.scanned) found.scanned = true;
  broadcastState();
  res.json({ ok: true, success: true, qrCodes: gameState.qrCodes });
});
// Printable QR codes without showing actual code text
app.get("/print-qr", async (req, res) => {
  try {
    const qrWithImages = await Promise.all(
      gameState.qrCodes.map(async (c) => ({
        qrImage: await QRCode.toDataURL(c.code, { width: 300 }),
      }))
    );

    const html = `
      <html>
        <head>
          <title>Escape Room QR Codes</title>
          <style>
            body { 
              font-family: sans-serif; 
              display: flex; 
              flex-wrap: wrap; 
              gap: 20px; 
              padding: 20px; 
              background: #f0f0f0;
            }
            .qr { 
              text-align: center; 
              border: 1px solid #ccc; 
              padding: 10px; 
              border-radius: 8px; 
              width: 200px; 
              background: #fff;
            }
            img { width: 200px; height: 200px; }
          </style>
        </head>
        <body>
          ${qrWithImages
            .map(
              (q) => `
            <div class="qr">
              <img src="${q.qrImage}" />
            </div>
          `
            )
            .join("")}
        </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    console.error("❌ Error generating printable QR codes:", err);
    res.status(500).send("QR generation failed");
  }
});

// Admin toggles
app.post("/admin/toggle-recovery-code", (req, res) => {
  const { code } = req.body;
  const found = gameState.recoveryCodes.find((c) => c.code === code);
  if (found) found.entered = !found.entered;
  broadcastState();
  res.json({ ok: true, recoveryCodes: gameState.recoveryCodes });
});

app.post("/admin/toggle-qr-code", (req, res) => {
  const { code } = req.body;
  const found = gameState.qrCodes.find((c) => c.code === code);
  if (found) found.scanned = !found.scanned;
  broadcastState();
  res.json({ ok: true, qrCodes: gameState.qrCodes });
});

// ------------------------------
// 📡 Helpers
// ------------------------------
function broadcastState() {
  io.emit("game-state", gameState);
}

// ------------------------------
// 🚀 Start Server
// ------------------------------
const PORT = 3000;

// Serve static frontend files
const frontendPath = path.join(__dirname, "../client/dist");
app.use(express.static(frontendPath));

// If no API route matches, send frontend
// Catch-all route using regex
app.get(/^\/.*$/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
