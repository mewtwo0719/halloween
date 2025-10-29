import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket";

export const Route = createFileRoute("/game/qrcode")({
  component: QRCodeTool,
});

function QRCodeTool() {
  const socket = useSocket();
  const [qrCodes, setQrCodes] = useState<{ code: string; scanned: boolean }[]>(
    []
  );
  const [input, setInput] = useState("");
  const [alert, setAlert] = useState<{
    message: string;
    success: boolean;
  } | null>(null);
  const [finalCode, setFinalCode] = useState<string | null>(null);

  const loadQrCodes = async () => {
    try {
      const res = await fetch("http://localhost:3000/qr-codes");
      const data = await res.json();
      setQrCodes(data.qrCodes);

      // If all QR codes already scanned (page reload), set final code
      const allScanned = data.qrCodes.every((c: any) => c.scanned);
      if (allScanned) setFinalCode("6158"); // or the server FINAL_HIDDEN_CODE
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadQrCodes();

    if (!socket) return;

    const handleState = (state: any) => {
      if (state.qrCodes) setQrCodes(state.qrCodes);
    };

    const handleAllScanned = ({ finalCode }: { finalCode: string }) => {
      setAlert({
        message: `🔓 Hidden code unlocked: ${finalCode}`,
        success: true,
      });
      setFinalCode(finalCode);
    };

    socket.on("game-state", handleState);
    socket.on("all-qr-scanned", handleAllScanned);

    return () => {
      socket.off("game-state", handleState);
      socket.off("all-qr-scanned", handleAllScanned);
    };
  }, [socket]);

  const submitQrCode = async (code: string) => {
    if (!code) return;

    const existing = qrCodes.find((c) => c.code === code);
    if (existing && existing.scanned) {
      setAlert({
        message: `⚠️ Code ${code} has already been scanned!`,
        success: false,
      });
      setTimeout(() => setAlert(null), 3000);
      setInput("");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/submit-qr-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (data.success) {
        setQrCodes(data.qrCodes);
        setAlert({ message: `✅ Code ${code} accepted!`, success: true });

        // Check if all QR codes are now scanned locally
        const allScanned = data.qrCodes.every((c: any) => c.scanned);
        if (allScanned && !finalCode) {
          setFinalCode("6158"); // ensure final code is shown
        }
      } else {
        setAlert({ message: `❌ Invalid code: ${code}`, success: false });
      }
    } catch (err) {
      console.error(err);
      setAlert({ message: "⚠️ Server error", success: false });
    }

    setInput("");
    setTimeout(() => setAlert(null), 3000);
  };

  const scannedCount = qrCodes.filter((c) => c.scanned).length;
  const totalCount = qrCodes.length;
  const unlocked = scannedCount === totalCount || finalCode !== null;

  return (
    <div className="p-4 flex flex-col gap-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2 text-center">QR Code Scanner</h2>

      {/* Progress bar */}
      <div className="bg-red-900 p-3 rounded flex items-center justify-between">
        <span className="font-mono text-sm">
          Scanned: {scannedCount} / {totalCount}
        </span>
        <div className="w-1/2 bg-zinc-800 h-3 rounded overflow-hidden mx-2">
          <div
            className="bg-green-500 h-full transition-all duration-300"
            style={{ width: `${(scannedCount / totalCount) * 100}%` }}
          ></div>
        </div>
        <span className="font-mono text-xs">
          {Math.round((scannedCount / totalCount) * 100)}%
        </span>
      </div>

      {/* Alert */}
      {alert && (
        <div
          className={`p-2 rounded text-center font-mono ${
            alert.success ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {alert.message}
        </div>
      )}

      {/* Input for QR code */}
      {!unlocked && (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter QR code"
            className="flex-1 p-2 rounded border font-mono text-sm"
          />
          <button
            onClick={() => submitQrCode(input)}
            className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Submit
          </button>
        </div>
      )}

      {/* Only show scanned QR codes */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {qrCodes
          .filter((c) => c.scanned)
          .map((c) => (
            <div
              key={c.code}
              className="p-2 border rounded text-center font-mono bg-green-500 text-white"
            >
              {c.code}
            </div>
          ))}
      </div>

      {/* Corrupted file / unlocked content */}
      <div className="mt-6 text-center">
        {!unlocked ? (
          <div className="p-6 border-4 border-dashed border-red-700 rounded bg-zinc-900 text-red-500 font-mono">
            CORRUPTED FILE
          </div>
        ) : (
          <div className="p-6 border rounded bg-green-800 text-white font-mono">
            🔓 File Unlocked! Hidden code:{" "}
            <span className="font-bold">{finalCode}</span>
          </div>
        )}
      </div>
    </div>
  );
}
