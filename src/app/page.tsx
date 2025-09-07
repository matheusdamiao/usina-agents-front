// app/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Sidebar, SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";

type Message = { role: "user" | "assistant"; text: string };
type Agent = { id: string; label: string };

export default function ChatPage() {
  // Available agents
  const agents: Agent[] = [
    { id: "weatherAgent", label: "Previsão do Tempo" },
    { id: "clinicAgent", label: "Secretária de Clínica" },
  ];

  // Store chat history for each agent
  const [chats, setChats] = useState<Record<string, Message[]>>(
    agents.reduce((acc, agent) => ({ ...acc, [agent.id]: [] }), {})
  );

  // Current selected agent
  const [currentAgent, setCurrentAgent] = useState<string>(agents[0].id);

  const [input, setInput] = useState("");

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;

    // Add user message to current agent's chat
    setChats((prev) => ({
      ...prev,
      [currentAgent]: [...prev[currentAgent], { role: "user", text: userMessage }],
    }));

    setInput("");

    try {
      const res = await fetch(
        `https://rhythmic-black-petabyte.mastra.cloud/api/agents/${currentAgent}/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: userMessage }),
        }
      );

      const data = await res.json();
      console.log("res da msg", data)

      setChats((prev) => ({
        ...prev,
        [currentAgent]: [...prev[currentAgent], { role: "assistant", text: data.text }],
      }));
    } catch (err) {
      console.error(err);
      setChats((prev) => ({
        ...prev,
        [currentAgent]: [...prev[currentAgent], { role: "assistant", text: "Error contacting server." }],
      }));
    }
  }

  return (
    <div className="h-[95%] w-full flex items-center justify-center flex-col">
      {/* Sidebar */}
      <Sidebar>
        <div className="px-2">
          <div className="flex justify-between items-center">
           <h2 className="font-bold mb-3 pt-2">Usina AI - Agentes      </h2>
            <SidebarTrigger  className="flex-0"/>
          </div>
          {agents.map((agent) => (
            <Button
              variant="secondary"
              key={agent.id}
              onClick={() => setCurrentAgent(agent.id)}
              className={`block w-full text-left px-2 py-1 rounded mb-1 hover:bg-slate-400 ${
                currentAgent === agent.id ? "bg-slate-600 text-white" : "hover:bg-slate-400"
              }`}
            >
              {agent.label}
            </Button>
          ))}
        </div>
      </Sidebar>

      {/* <div class="self-start">
        {agents.find(a=> a.id === currentAgent)?.label}
      </div> */}
      {/* Chat Area */}
      <main className="flex-1 flex flex-col p-4 w-full h-full max-w-[600px]">
        <div className="flex-1 overflow-y-auto border rounded-lg p-3 mb-4 ">
          {chats[currentAgent]?.map((m, i) => (
            <div
              key={i}
              className={`mb-2 ${
                m.role === "user" ? "text-right text-blue-600" : "text-left text-green-700"
              }`}
            >
              <span className="inline-block max-w-[70%] p-2 rounded-lg bg-white shadow">
                {m.text}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border rounded-lg p-2"
            placeholder={`Fale com  ${agents.find((a) => a.id === currentAgent)?.label}...`}
          />
          <Button type="submit">
            Enviar
          </Button>
        </form>
      </main>
    </div>
  );
}
