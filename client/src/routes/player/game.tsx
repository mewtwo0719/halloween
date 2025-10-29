import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

export const Route = createFileRoute("/player/game")({
  component: GameScreen,
});

function GameScreen() {
  const [qrCodes, setQrCodes] = useState([]);
  const [scanned, setScanned] = useState({});
  const [message, setMessage] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [activeTab, setActiveTab] = useState("qr");

  // Load QR codes from backend
  useEffect(() => {
    fetch("http://localhost:3000/printable-qr-codes")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setQrCodes(data.qrCodes);
      });
  }, []);

  // Listen to game state updates from backend
  useEffect(() => {
    socket.on("game-state", (state) => {
      setScanned(state.scannedQRCodes || {});
    });
    return () => socket.off("game-state");
  }, []);

  const handleSubmit = () => {
    if (inputCode && !scanned[inputCode]) {
      socket.emit("scan-qr", { codeId: inputCode });
      setMessage(`Sent: ${inputCode}`);
      setInputCode("");
    }
  };

  const scannedCount = Object.keys(scanned).length;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6 gap-6">
      <h1 className="text-3xl font-bold">Escape Room Game</h1>
      <p>
        QR Codes scanned: {scannedCount} / {qrCodes.length}
      </p>
      {message && <p className="text-green-400">{message}</p>}

      {/* Tabs */}
      <div className="flex gap-4 mt-4">
        {["qr", "terminal", "counter"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-xl font-semibold ${
              activeTab === tab
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {tab === "qr"
              ? "Scattered QR Codes"
              : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="w-full bg-gray-800 p-6 rounded-b-xl mt-0">
        {activeTab === "qr" && (
          <div className="flex flex-col items-center gap-4">
            <input
              type="text"
              placeholder="Enter QR code here"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="p-2 rounded-lg text-black w-64"
            />
            <button
              onClick={handleSubmit}
              className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Send QR Code
            </button>
          </div>
        )}

        {activeTab === "terminal" && (
          <div className="text-center text-gray-300">
            Terminal tool coming soon.
          </div>
        )}

        {activeTab === "counter" && (
          <div className="text-center text-gray-300">
            Counter tool coming soon.
          </div>
        )}
      </div>

      {/* Optional: List of QR codes with scanned status */}
      <div className="grid grid-cols-3 gap-4 mt-6 w-full">
        {qrCodes.map((q) => (
          <div
            key={q.id}
            className={`p-4 rounded-2xl text-center ${
              scanned[q.value] ? "bg-green-700" : "bg-gray-800"
            }`}
          >
            <p>
              {q.value} {scanned[q.value] ? "✅" : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
