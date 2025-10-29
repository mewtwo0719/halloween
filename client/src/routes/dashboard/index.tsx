import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket";

export const Route = createFileRoute("/dashboard/")({
  component: RansomwareDashboard,
});

function RansomwareDashboard() {
  const socket = useSocket();
  const [qrCodes, setQrCodes] = useState<{ code: string; scanned: boolean }[]>(
    []
  );
  const [recoveryCodes, setRecoveryCodes] = useState<
    { code: string; entered: boolean }[]
  >([]);
  const [finalCode, setFinalCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // 10 minutes countdown

  // Update state from server
  useEffect(() => {
    if (!socket) return;

    const handleState = (state: any) => {
      setQrCodes(state.qrCodes || []);
      setRecoveryCodes(state.recoveryCodes || []);
    };

    const handleAllScanned = ({ finalCode }: { finalCode: string }) => {
      setFinalCode(finalCode);
    };

    socket.on("game-state", handleState);
    socket.on("all-qr-scanned", handleAllScanned);

    socket.emit("request-game-state");

    return () => {
      socket.off("game-state", handleState);
      socket.off("all-qr-scanned", handleAllScanned);
    };
  }, [socket]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const scannedCount = qrCodes.filter((c) => c.scanned).length;
  const totalQr = qrCodes.length;
  const enteredCount = recoveryCodes.filter((c) => c.entered).length;
  const totalRecovery = recoveryCodes.length;

  return (
    <div className="min-h-screen bg-black text-red-400 font-mono flex flex-col items-center justify-start p-4 gap-6">
      {/* Scary Ransomware Message */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-2">
          ⚠️ SYSTEM COMPROMISED ⚠️
        </h1>
        <p className="text-lg text-red-300">
          All files encrypted. Recover fragments before time runs out or data
          will be lost forever!
        </p>
      </div>

      {/* Countdown Timer */}
      <div className="text-2xl font-bold border-4 border-red-700 rounded px-6 py-4 bg-black/80">
        Time Remaining:{" "}
        <span className="text-red-500">{formatTime(timeLeft)}</span>
      </div>

      {/* Progress Bars */}
      <div className="w-full max-w-lg space-y-4">
        {/* QR Code Progress */}
        <div>
          <div className="flex justify-between mb-1">
            <span>QR Fragments Scanned</span>
            <span>
              {scannedCount} / {totalQr}
            </span>
          </div>
          <div className="w-full bg-zinc-800 h-4 rounded overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all duration-500"
              style={{ width: `${(scannedCount / totalQr) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Recovery Code Progress */}
        <div>
          <div className="flex justify-between mb-1">
            <span>Recovery Fragments Entered</span>
            <span>
              {enteredCount} / {totalRecovery}
            </span>
          </div>
          <div className="w-full bg-zinc-800 h-4 rounded overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-500"
              style={{ width: `${(enteredCount / totalRecovery) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Scanned QR Codes */}
      <div className="w-full max-w-lg grid grid-cols-3 gap-2 mt-4">
        {qrCodes
          .filter((c) => c.scanned)
          .map((c) => (
            <div
              key={c.code}
              className="bg-green-600 text-black text-center rounded py-2 font-bold"
            >
              {c.code}
            </div>
          ))}
      </div>

      {/* Recovery Codes */}
      <div className="w-full max-w-lg grid grid-cols-3 gap-2 mt-2">
        {recoveryCodes
          .filter((c) => c.entered)
          .map((c) => (
            <div
              key={c.code}
              className="bg-yellow-500 text-black text-center rounded py-2 font-bold"
            >
              {c.code}
            </div>
          ))}
      </div>

      {/* Final Code */}
      {finalCode && (
        <div className="text-center text-3xl font-bold text-green-500 mt-6">
          🔓 Hidden Key Recovered: {finalCode}
        </div>
      )}
    </div>
  );
}
