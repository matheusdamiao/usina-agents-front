"use client";

import { Button } from "@/components/ui/button";
import { Sidebar, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import { getAgentMemory, setAgentMemory } from "@/lib/cookies";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Cookies from "js-cookie";
import { Trash2 } from "lucide-react";
import { SquareMousePointer } from "lucide-react";
import corretora from './../../public/images/corretora.png'
import secretaria from './../../public/images/secretaria.png'
import ancora from './../../public/images/ancora.png'



type Message = { role: "user" | "assistant"; text: string };
type Agent = { id: string; label: string, photo?: string, description?: string };

export default function ChatPage() {
  const agents: Agent[] = [
    { id: "weatherAgent", label: "João", photo: ancora.src, description: "Meteorologista" },
    { id: "clinicAgent", label: "Rosana", photo: secretaria.src, description: "Secretária de Clínica" },
    { id: "realEstateAgent", label: "Roberta", photo: corretora.src, description: 'Corretora imobiliária' },
  ];

  const [chats, setChats] = useState<Record<string, Message[]>>(
    agents.reduce((acc, agent) => ({ ...acc, [agent.id]: [] }), {})
  );

  const [isWelcomeScreen, setIsWelcomeScreen] = useState<boolean>(true);
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
          role: m.role === "tool" ? "assistant" : m.role, 
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
        `https://rhythmic-black-petabyte.mastra.cloud/api/agents/${currentAgent}/generate/vnext`,
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
      console.log('data', data)
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
          { role: "assistant", text: "Erro ao carregar as mensagens." },
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
              <h2 className="font-bold mb-3 pt-2 cursor-pointer" onClick={()=> setIsWelcomeScreen(true)}>Usina AI - Agentes</h2>
              <SidebarTrigger className="flex-0" />
            </div>
            {agents.map((agent) => (
             
                
                <Button
                  variant="secondary"
                 key={agent.id}
                  onClick={() => {
                    setCurrentAgent(agent.id)
                    setIsWelcomeScreen(false)
                  }}
                  className={`flex justify-start h-min w-full text-left px-2 py-1 rounded mb-1 hover:bg-slate-400 ${
                    currentAgent === agent.id ? "bg-slate-600 text-white" : "hover:bg-slate-400"
                  }`}
                >
                 
                  <img src={agent.photo ? agent.photo : undefined} className="max-w-[30px]" alt="" />
                  <div>
                      <p className="margin-0">{agent.label}</p>
                    <small  className={`flex justify-start h-min w-full text-left font-normal ${
                    currentAgent === agent.id ? "text-gray-200" : "text-gray-500 "
                  }`}>{agent.description}</small>
                  </div>
                
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
        {isWelcomeScreen &&
        <div className="flex items-center justify-center h-[100svh] flex-col gap-6">
          <h3 className="lg:text-4xl text-2xl text-center font-bold text-gray-700">Bem-vindo(a) à Usina AI Labs!</h3>
          <p className="text-center lg:text-xl text-sm text-gray-600">Este é um ambiente interativo construído exclusivamente para você conversar e conhecer alguns de nossos agentes. <br /> Fique à vontade para explorar! </p>
          <div className="flex flex-col gap-2 w-[80%] pt-6">
            <p className="inline-flex items-start lg:gap-4 gap-2 lg:text-lg text-xs text-gray-500"><SquareMousePointer size='30'/>Navegue pelos agentes através do menu da esquerda e converse em tempo real </p>
            <small className="inline-flex  items-start lg:gap-4 gap-2 lg:text-lg text-xs text-gray-500"><Trash2 size='30'/>Todo o histórico de conversas pode ser excluídas através do botão inferior do menu</small>
          </div>
        </div>
        }
        {!isWelcomeScreen &&
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
                {/* <small>{m.}</small> */}
              </span>
            </div>
          ))}
        </div>
        }
        {!isWelcomeScreen &&
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
        }
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
