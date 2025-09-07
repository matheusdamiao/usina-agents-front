"use client";

import { Button } from "@/components/ui/button";
import { Sidebar, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import { getAgentMemory, setAgentMemory } from "@/lib/cookies";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Cookies from "js-cookie";
import { Trash2 } from "lucide-react";

type Message = { role: "user" | "assistant"; text: string };
type Agent = { id: string; label: string };

export default function ChatPage() {
  const agents: Agent[] = [
    { id: "weatherAgent", label: "Previsão do Tempo" },
    { id: "clinicAgent", label: "Secretária de Clínica" },
  ];

  const [chats, setChats] = useState<Record<string, Message[]>>(
    agents.reduce((acc, agent) => ({ ...acc, [agent.id]: [] }), {})
  );

  const [currentAgent, setCurrentAgent] = useState<string>(agents[0].id);
  const [input, setInput] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  // Load messages from cookie+API on agent change
  useEffect(() => {
    const memory = getAgentMemory(currentAgent);
    if (!memory || !memory.thread || !memory.resource) {
        // if not present or invalid, generate a new thread/resource
        const newMemory = {
          thread: `${currentAgent}-thread-${Date.now()}`,
          resource: `user-${Date.now()}`,
        };
        setAgentMemory(currentAgent, newMemory);
        return;
    }

    // fetch messages from API
    fetch(
      `https://rhythmic-black-petabyte.mastra.cloud/api/memory/threads/${memory.thread}/messages?agentId=${currentAgent}`
    )
      .then((res) => res.json())
      .then((data) => {
        const msgs = data.uiMessages?.map((m: any) => ({
          role: m.role === "tool" ? "assistant" : m.role, // map tools → assistant
          text: typeof m.content === "string" ? m.content : m.parts?.[0]?.text || "",
        }));
        setChats((prev) => ({ ...prev, [currentAgent]: msgs || [] }));
      })
      .catch((err) => console.error("Load msgs error", err));
  }, [currentAgent]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const memory = getAgentMemory(currentAgent);
    if (!memory) return; // should never happen after init

    const userMessage = input;
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
          body: JSON.stringify({
            messages: [{ role: "user", content: userMessage }],
            memory,
            maxSteps: 5,
            temperature: 0.7,
          }),
        }
      );

      const data = await res.json();
      setChats((prev) => ({
        ...prev,
        [currentAgent]: [...prev[currentAgent], { role: "assistant", text: data.text }],
      }));
    } catch (err) {
      console.error(err);
      setChats((prev) => ({
        ...prev,
        [currentAgent]: [
          ...prev[currentAgent],
          { role: "assistant", text: "Error contacting server." },
        ],
      }));
    }
  }

  function resetChats() {
   const emptyMemories = agents.reduce(
    (acc, agent) => ({
      ...acc,
      [agent.id]: { thread: "", resource: "" },
    }),
    {}
  );
    Cookies.set("agentMemory", JSON.stringify(emptyMemories), { expires: 7 });
    const emptyChats = agents.reduce(
      (acc, agent) => ({ ...acc, [agent.id]: [] }),
      {}
    );
    setChats(emptyChats);
    setShowResetDialog(false);
  }

  return (
    <div className="h-full w-full flex items-center justify-center flex-col">
      <Sidebar >
        <div className="px-2 flex flex-col h-full justify-between">
          <div>
            <div className="flex justify-between items-center">
              <h2 className="font-bold mb-3 pt-2">Usina AI - Agentes</h2>
              <SidebarTrigger className="flex-0" />
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
          <SidebarFooter>
            <div className="mt-6 border-t pt-3">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowResetDialog(true)}
              >
                <Trash2 color="red"/>
                Resetar Conversas
              </Button>
            </div>
        </SidebarFooter>
       
        </div>
        
      </Sidebar>

      <main className="flex-1 flex flex-col p-4 w-full h-full max-w-[600px]">
        <div className="flex-1 overflow-y-auto border rounded-lg p-3 mb-4">
          {chats[currentAgent]?.map((m, i) => (
            <div
              key={i}
              className={`mb-2 ${
                m.role === "user" ? "text-right  text-blue-600" : "text-left text-gray-500"
              }`}
            >
              <span className={`inline-block max-w-[70%] p-2 rounded-lg shadow
                 ${m.role === "user" ? "bg-blue-400 text-white": "bg-blue-100/50"}
                `}>
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
            placeholder={`Fale com ${
              agents.find((a) => a.id === currentAgent)?.label
            }...`}
          />
          <Button type="submit">Enviar</Button>
        </form>
      </main>

       <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar Conversas</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja apagar todas as conversas? Essa ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={resetChats}>
              Resetar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
