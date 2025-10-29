import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useSocket } from "../../hooks/useSocket";

export const Route = createFileRoute("/game/recovery")({
  component: RecoveryTool,
});

function RecoveryTool() {
  const socket = useSocket();
  const [input, setInput] = useState("");
  const [enteredCount, setEnteredCount] = useState(0);
  const [recentMasked, setRecentMasked] = useState<string[]>([]);
  const [lastFull, setLastFull] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | "success" | "error">(null);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const maskCode = (code: string) => {
    if (!code) return "****";
    return code[0] + code.slice(1).replace(/[0-9]/g, "*");
  };

  const submitCode = async () => {
    const trimmed = input.trim();
    if (!/^\d{4}$/.test(trimmed)) {
      setStatus("error");
      setMessage("Code must be 4 digits.");
      shakeAndClearMessage();
      return;
    }

    setLoading(true);
    setStatus(null);
    setMessage(null);

    try {
      const res = await fetch("http://localhost:3000/submit-recovery-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();

      if (data && data.success) {
        setLastFull(trimmed); // Show full last code entered
        setStatus("success");
        setMessage("Code accepted — fragment unlocked.");
      } else {
        setStatus("error");
        setMessage(data?.message || "Invalid code or already entered.");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Network error — try again.");
    } finally {
      setLoading(false);
      setInput("");
      shakeAndClearMessage();
    }
  };

  const shakeAndClearMessage = () => {
    setTimeout(() => setMessage(null), 2500);
    setTimeout(() => setStatus(null), 3000);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submitCode();
  };

  // Subscribe to game state updates
  useEffect(() => {
    if (!socket) return;

    const handleGameState = (state: any) => {
      if (!state.recoveryCodes) return;

      const entered = state.recoveryCodes.filter((c: any) => c.entered).length;
      setEnteredCount(entered);

      const recentlyEntered = state.recoveryCodes
        .filter((c: any) => c.entered)
        .slice(-3)
        .map((c: any) => maskCode(c.code));
      setRecentMasked(recentlyEntered);

      // Show full last code
      if (state.recoveryCodes.length) {
        const last = state.recoveryCodes
          .filter((c: any) => c.entered)
          .slice(-1)[0];
        setLastFull(last?.code || null);
      }
    };

    socket.on("game-state", handleGameState);

    // Optionally request initial state
    socket.emit("request-game-state");

    return () => {
      socket.off("game-state", handleGameState);
    };
  }, [socket]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="w-full max-w-md">
        <div className="relative rounded-lg shadow-xl border-2 border-zinc-800 bg-[#0b0b0b] text-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 bg-gradient-to-r from-red-900 via-red-800 to-red-900 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded bg-black/30 border border-red-700">
                <svg
                  className="w-6 h-6 text-red-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    d="M12 15v2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                  <rect
                    x="6"
                    y="10"
                    width="12"
                    height="10"
                    rx="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></rect>
                  <path
                    d="M9 10V8a3 3 0 1 1 6 0v2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </div>
              <div>
                <div className="text-sm font-mono text-red-200">
                  ENCRYPTED_FILE.TAR.GZ
                </div>
                <div className="text-xs text-red-100/80">
                  AES-256 / partial key required
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-red-100/70">
              {enteredCount} / 10 fragments recovered
            </div>
          </div>

          <div className="p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                className={
                  "flex-1 text-2xl font-mono tracking-widest text-center py-3 rounded-md border-2 " +
                  (status === "error"
                    ? "border-red-500 ring-2 ring-red-400/30"
                    : status === "success"
                      ? "border-green-500 ring-2 ring-green-400/30"
                      : "border-zinc-700 bg-black/40")
                }
                placeholder="• • • •"
                disabled={loading}
              />
              <button
                onClick={submitCode}
                disabled={loading}
                className="px-4 py-3 bg-red-700 hover:bg-red-600 disabled:opacity-50 rounded text-white font-semibold"
              >
                {loading ? "Verifying..." : "Submit"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded border border-zinc-700 bg-black/30">
                <div className="text-xs text-gray-400 mb-1">Recent unlocks</div>
                {recentMasked.length === 0 ? (
                  <div className="text-sm text-gray-300">
                    No fragments recovered yet.
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {recentMasked.map((m, i) => (
                      <li key={i} className="font-mono text-sm text-gray-100">
                        {m}
                      </li>
                    ))}
                  </ul>
                )}
                {lastFull && (
                  <div className="mt-2 text-sm font-mono text-green-300">
                    Last entered code: {lastFull}
                  </div>
                )}
              </div>
              <div className="p-3 rounded border border-zinc-700 bg-black/30">
                <div className="text-xs text-gray-400 mb-1">Threat note</div>
                <div className="text-sm text-gray-300">
                  The archive is encrypted. Recover all 10 fragments to
                  reassemble the key. Duplicate fragments are ignored.
                </div>
              </div>
            </div>

            {message && (
              <div
                className={`text-center py-2 rounded text-sm font-semibold ${
                  status === "success" ? "text-green-300" : "text-red-300"
                }`}
              >
                {message}
              </div>
            )}
          </div>

          <div className="px-4 py-3 bg-black/20 border-t border-zinc-800 flex items-center justify-between text-xs text-gray-400">
            <div>Connected to local server</div>
            <div>
              Integrity: <span className="font-mono">AES-256</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
