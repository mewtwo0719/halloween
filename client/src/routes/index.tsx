import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useSocket } from "../hooks/useSocket";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const router = useRouter();
  const socket = useSocket();

  const joinGame = () => {
    // Optional: tell backend player joined
    socket?.emit("join-game");
    router.navigate({ to: "/game" }); // navigate to /game
  };

  return (
    <div className="p-2 flex flex-col items-center justify-center h-screen">
      <h2 className="text-2xl font-bold mb-6">Welcome to the Escape Room!</h2>

      <button
        onClick={joinGame}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Join Game
      </button>
    </div>
  );
}
