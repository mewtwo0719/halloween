// src/contexts/useSocket.ts
import { useContext } from "react";
import type { Socket } from "socket.io-client";
import { SocketContext } from "../contexts/SocketProvider";

export const useSocket = (): Socket | null => {
  return useContext(SocketContext);
};
