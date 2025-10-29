import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/game/")({
  component: GameIndex,
});

function GameIndex() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Game Dashboard</h2>
      <p>Welcome to the escape room game!</p>

      <div className="mt-6 flex flex-col gap-2">
        <a
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          href="/game/qrcode"
        >
          Scan QR Codes
        </a>
        <a
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          href="/game/recovery"
        >
          Enter Recovery Codes
        </a>
      </div>
    </div>
  );
}
