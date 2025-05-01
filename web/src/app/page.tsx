"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { FC, FormEvent, useEffect, useRef, useState } from "react";
import { LucideDot, LucideGamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";
type Role = "CID" | "Killer" | "Player";

export default function Home() {
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [connected, setConnected] = useState(false);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      "wss://cid-ws.samirdiff.workers.dev/connect?room=test-room"
    );
    wsRef.current = ws;

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      switch (data.type) {
        case "player-joined":
          setMessages((prev) => [...prev, `${data.name} joined the game`]);
          if (data.isAdmin) {
            setIsAdmin(true);
          }
          break;

        case "you-are-now-admin":
          setIsAdmin(true);
          setMessages((prev) => [...prev, "You are now the admin."]);
          break;

        case "player-joined":
          if (data.isAdmin) {
            setMessages((prev) => [...prev, `${data.name} joined the game`]);
            setIsAdmin(true);
          }

          break;

        case "game-started": {
          setMessages((prev) => [...prev, "Game started!"]);
          break;
        }

        case "role": {
          setRole(data.role);
          break;
        }

        case "error": {
          alert(data.message);
          break;
        }

        default:
          break;
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleStart = () => {
    wsRef.current?.send(JSON.stringify({ type: "start" }));
  };

  const handleJoinForm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const name = fd.get("name");

    if (typeof name !== "string" || name.trim().length === 0) {
      return alert("pls gimme nameeeee");
    }
    if (!wsRef.current) {
      return alert("there is no ws instance");
    }

    wsRef.current.send(JSON.stringify({ type: "join", name }));
    setConnected(true);
  };

  return (
    <div className="space-y-5 text-center ">
      <h1 className="scroll-m-20 text-4xl my-5 font-extrabold tracking-tight lg:text-5xl font-(family-name:--font-creepster)">
        CID Heroes
      </h1>

      <div className="inline-flex items-center gap-1">
        Status:{" "}
        <b>
          {wsRef.current?.readyState === wsRef.current?.OPEN
            ? "Connected"
            : "Disconnected"}
        </b>
        <LucideDot
          className={cn(
            wsRef.current?.readyState === wsRef.current?.OPEN
              ? "stroke-green-500"
              : "stroke-red-500"
          )}
        />
      </div>

      {!connected ? (
        <form
          className="flex flex-col bg-secondary mx-5 border p-5 rounded-xl gap-3 items-start"
          onSubmit={handleJoinForm}
        >
          <Image
            src="/poster.jpg"
            className="mx-auto"
            height={200}
            width={250}
            alt=""
          />

          <Label>Name</Label>
          <Input placeholder="gimme ur name :3" name="name" />
          <Button type="submit" className="w-full" size="lg">
            Join the game <LucideGamepad2 />
          </Button>
        </form>
      ) : null}

      {isAdmin && connected && (
        <Button
          onClick={handleStart}
          size="lg"
          className="text-white fixed bottom-5"
        >
          Start Game (Admin)
        </Button>
      )}

      {connected ? (
        <div
          className={cn(
            "grid border divide-y md:divide-x p-4 mx-5 grid-cols-1  gap-5 rounded-lg",
            isAdmin && "md:grid-cols-3"
          )}
        >
          {isAdmin ? (
            <ul className="p-2 list-disc text-start text-sm">
              {messages.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-col col-span-2 bg-neutral-900 rounded-lg p-3">
            {role ? (
              <>
                <div className="text-base font-sans">YOU GOT</div>
                <div className="text-3xl tracking-wide font-(family-name:--font-creepster) font-bold">
                  {role}
                </div>
                <div className="min-h-[20px]" />

                <RoleImage role={role} />
              </>
            ) : (
              <div className="text-base font-sans">pls let your host start</div>
            )}
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
    />
  </div>
);
