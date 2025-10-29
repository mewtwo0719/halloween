import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket";

export const Route = createFileRoute("/game/admin")({
  component: AdminPage,
});

function AdminPage() {
  const socket = useSocket();
  const [recoveryCodes, setRecoveryCodes] = useState<
    { code: string; entered: boolean }[]
  >([]);
  const [qrCodes, setQrCodes] = useState<{ code: string; scanned: boolean }[]>(
    []
  );

  // Compute progress
  const recoveryEntered = recoveryCodes.filter((c) => c.entered).length;
  const qrScanned = qrCodes.filter((c) => c.scanned).length;
  const recoveryPercentage = recoveryCodes.length
    ? Math.round((recoveryEntered / recoveryCodes.length) * 100)
    : 0;
  const qrPercentage = qrCodes.length
    ? Math.round((qrScanned / qrCodes.length) * 100)
    : 0;
  const totalPercentage = Math.round(
    ((recoveryEntered + qrScanned) / (recoveryCodes.length + qrCodes.length)) *
      100
  );

  useEffect(() => {
    if (!socket) return;

    const handleGameState = (state: any) => {
      if (state.recoveryCodes) setRecoveryCodes(state.recoveryCodes);
      if (state.qrCodes) setQrCodes(state.qrCodes);
    };

    socket.on("game-state", handleGameState);

    // Optionally, request initial state if not already sent
    socket.emit("request-game-state");

    return () => {
      socket.off("game-state", handleGameState);
    };
  }, [socket]);

  // Toggle recovery code entered
  const toggleRecoveryCode = async (code: string) => {
    try {
      // Optimistically update
      setRecoveryCodes((prev) =>
        prev.map((c) => (c.code === code ? { ...c, entered: !c.entered } : c))
      );

      await fetch("http://localhost:3000/admin/toggle-recovery-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleQrCode = async (code: string) => {
    try {
      setQrCodes((prev) =>
        prev.map((c) => (c.code === code ? { ...c, scanned: !c.scanned } : c))
      );

      await fetch("http://localhost:3000/admin/toggle-qr-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const resetGame = async () => {
    try {
      await fetch("http://localhost:3000/reset", { method: "POST" });
      // Socket.IO will push new state automatically
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-center">Admin: Game Progress</h2>

      <ProgressBar
        label="Recovery Codes"
        count={recoveryEntered}
        total={recoveryCodes.length}
        percentage={recoveryPercentage}
        color="green"
      />
      <ProgressBar
        label="QR Codes"
        count={qrScanned}
        total={qrCodes.length}
        percentage={qrPercentage}
        color="purple"
      />

      <div className="mt-4 p-4 bg-zinc-800 text-white text-center rounded">
        <p className="font-bold text-lg">
          Total Game Completion: {totalPercentage}%
        </p>
      </div>

      {/* Codes management */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Recovery Codes</h3>
        <div className="grid grid-cols-4 gap-2">
          {recoveryCodes.map((c) => (
            <button
              key={c.code}
              onClick={() => toggleRecoveryCode(c.code)}
              className={`p-2 rounded border font-mono text-sm relative overflow-hidden
                ${c.entered ? "bg-green-500 text-white" : "bg-gray-800 text-gray-800 hover:text-white hover:bg-gray-700"}
              `}
            >
              <span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                {c.code}
              </span>
              {c.entered ? "✔" : ""}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">QR Codes</h3>
        <div className="grid grid-cols-4 gap-2">
          {qrCodes.map((c) => (
            <button
              key={c.code}
              onClick={() => toggleQrCode(c.code)}
              className={`p-2 rounded border font-mono text-sm relative overflow-hidden
                ${c.scanned ? "bg-purple-500 text-white" : "bg-gray-800 text-gray-800 hover:text-white hover:bg-gray-700"}
              `}
            >
              <span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                {c.code}
              </span>
              {c.scanned ? "✔" : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={resetGame}
          className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded"
        >
          Reset Game State
        </button>
      </div>
    </div>
  );
}

function ProgressBar({ label, count, total, percentage, color }: any) {
  const colorClass = color === "green" ? "bg-green-500" : "bg-purple-500";
  return (
    <div className="mb-4">
      <h3 className="font-semibold">{label}</h3>
      <div className="w-full bg-gray-700 h-5 rounded overflow-hidden mt-1">
        <div
          className={`${colorClass} h-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-sm mt-1">
        {count} / {total} ({percentage}%)
      </p>
    </div>
  );
}
