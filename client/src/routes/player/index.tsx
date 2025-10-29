import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

export const Route = createFileRoute("/player/")({
  component: PlayerLobby,
});

function PlayerLobby() {
  const [gameState, setGameState] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    socket.emit("join-room", "lobby");

    socket.on("game-state", (state) => setGameState(state));
    return () => socket.off("game-state");
  }, []);

  const joinTeam = (team: string) => {
    socket.emit("join-team", team);
    navigate({ to: `/player/${team}` });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white gap-6">
      <h1 className="text-3xl font-bold">Join Your Team</h1>
      <div className="grid grid-cols-3 gap-6">
        {["developers", "analytics", "security"].map((team) => (
          <div
            key={team}
            onClick={() => joinTeam(team)}
            className="bg-gray-800 p-6 rounded-2xl hover:bg-gray-700 cursor-pointer transition"
          >
            <h2 className="text-xl capitalize">{team}</h2>
            <p>
              {gameState[team]?.playerCount ?? 0}{" "}
              {gameState[team]?.playerCount === 1 ? "player" : "players"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
