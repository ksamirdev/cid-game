"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { FC, useEffect, useRef, useState } from "react";
import { LucideLoader } from "lucide-react";
import { cn } from "@/lib/utils";

const wsURL = process.env.NEXT_PUBLIC_WS_URL;
if (!wsURL) throw new Error("Please specify NEXT_PUBLIC_WS_URL");

type Role = "CID" | "Killer" | "Player";
type ConnectionStatus = "CONNECTED" | "DISCONNECTED" | "RECONNECTING";

export default function Home() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("DISCONNECTED");

  const [role, setRole] = useState<Role | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [playersCount, setPlayersCount] = useState(0);

  const initWebSocket = () => {
    const ws = new WebSocket(wsURL!);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("CONNECTED");
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      switch (data.type) {
        case "player-joined":
          if (data.isAdmin) {
            setIsAdmin(true);
          }
          setPlayersCount(data.count);
          break;

        case "you-are-now-admin":
          setIsAdmin(true);
          break;

        case "player-left":
          setPlayersCount(data.count);
          break;

        case "roles-assigning":
          setRole(null);
          setIsAssigning(true);
          break;

        case "role":
          setIsAssigning(false);
          setRole(data.role);
          break;

        case "error":
          alert(data.message);
          break;

        default:
          break;
      }
    };

    ws.onclose = () => {
      setConnectionStatus("DISCONNECTED");
      setTimeout(initWebSocket, 2000);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setConnectionStatus("DISCONNECTED");

      setTimeout(initWebSocket, 2000);
    };
  };

  useEffect(() => {
    initWebSocket();

    // Handle app coming to foreground
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setConnectionStatus("RECONNECTING");

        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          initWebSocket();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleStart = () => {
    wsRef.current?.send(JSON.stringify({ type: "start" }));
  };

  return (
    <div className="space-y-5 text-center ">
      <h1 className="scroll-m-20 text-4xl my-5 font-extrabold tracking-tight lg:text-5xl font-(family-name:--font-creepster)">
        CID Heroes
      </h1>

      <div className="inline-flex items-center gap-1">
        <span>Status:</span>
        <b
          className={cn(
            connectionStatus === "CONNECTED" && "text-green-500",
            connectionStatus === "RECONNECTING" && "text-yellow-500",
            connectionStatus === "DISCONNECTED" && "text-red-500",
          )}
        >
          {connectionStatus === "CONNECTED"
            ? "Connected - " + playersCount + " players"
            : null}

          {connectionStatus === "DISCONNECTED" ? "Disconnected" : null}
          {connectionStatus === "RECONNECTING" ? "Reconnecting" : null}
        </b>
      </div>

      {isAdmin && connectionStatus === "CONNECTED" && (
        <Button
          onClick={handleStart}
          size="lg"
          disabled={isAssigning}
          className="text-white z-50 fixed bottom-5 left-1/2 -translate-x-1/2"
        >
          Start Game
        </Button>
      )}

      {connectionStatus === "CONNECTED" ? (
        <div
          className={cn(
            "grid border md:divide-x p-4 mx-5 grid-cols-1  gap-5 rounded-lg",
            isAdmin && "md:grid-cols-3",
          )}
        >
          <div className="flex flex-col col-span-2 bg-neutral-900 rounded-lg p-3">
            <div className="text-center px-4">
              {isAssigning ? (
                <>
                  <div className="text-base font-sans mx-auto">
                    <LucideLoader className="animate-spin mx-auto" />
                  </div>
                  <div className="text-3xl tracking-wide font-(family-name:--font-creepster) font-bold">
                    WAIT BRO
                  </div>
                  <div className="min-h-[20px]" />
                  <div>
                    <Image
                      src="/wait.jpg"
                      className="mx-auto rounded-lg"
                      height={200}
                      width={200}
                      alt="Waiting"
                      priority
                    />
                  </div>
                </>
              ) : (
                role && (
                  <>
                    <div className="text-base font-sans">YOU GOT</div>
                    <div className="text-3xl tracking-widest font-(family-name:--font-creepster) font-bold">
                      {role}
                    </div>
                    <div className="min-h-[20px]" />
                    <RoleImage role={role} />
                  </>
                )
              )}
            </div>

            {!role && !isAssigning ? (
              <div className="text-base font-sans">
                {isAdmin
                  ? "pls start, you're the admin"
                  : "pls let your host start"}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const RoleImage: FC<{ role: Role }> = ({ role }) => (
  <div>
    <Image
      src={`/${role.toLowerCase()}.jpg`}
      className="mx-auto rounded-lg"
      height={200}
      width={200}
      alt="CID"
      priority
    />
  </div>
);
