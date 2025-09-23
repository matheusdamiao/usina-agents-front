"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, SquareMousePointer } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useChat } from "@ai-sdk/react";
import {DefaultChatTransport } from 'ai'

import corretora from "./../../public/images/corretora.png";
import secretaria from "./../../public/images/secretaria.png";
import ancora from "./../../public/images/ancora.png";
import { getAgentMemory, setAgentMemory } from "@/lib/cookies";

type Agent = { id: string; label: string; photo?: string; description?: string };

export default function ChatPage() {
  const agents: Agent[] = [
    { id: "weatherAgent", label: "João", photo: ancora.src, description: "Meteorologista" },
    { id: "clinicAgent", label: "Rosana", photo: secretaria.src, description: "Secretária de Clínica" },
    { id: "realEstateAgent", label: "Roberta", photo: corretora.src, description: "Corretora imobiliária" },
  ];

  const [isWelcomeScreen, setIsWelcomeScreen] = useState<boolean>(true);
  const [currentAgent, setCurrentAgent] = useState<string>(agents[0].id);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [input, setInput] = useState("");
    const [chats, setChats] = useState<Record<string, any[]>>({});
  const [memory, setMemory] = useState<{ thread: string; resource: string } | null>(null);

  // 🔹 initialize or reuse memory for this agent
  useEffect(() => {
    let mem = getAgentMemory(currentAgent);
    if (!mem || !mem.thread || !mem.resource) {
      mem = {
        thread: `${currentAgent}-thread-111`,
        resource: `user-${Date.now()}`,
      };
      setAgentMemory(currentAgent, mem);
    }
    setMemory(mem);

    // fetch past messages
    fetch(
      `http://172.26.82.113:4111/api/memory/threads/${mem.thread}/messages?agentId=${currentAgent}`
    )
      .then((res) => res.json())
      .then((data) => {
        const msgs =
          data.uiMessages?.map((m: any) => ({
            role: m.role === "tool" ? "assistant" : m.role,
            text:
              typeof m.content === "string"
                ? m.content
                : m.parts?.[0]?.text || "",
          })) || [];
        setChats((prev) => ({ ...prev, [currentAgent]: msgs }));
      })
      .catch((err) => console.error("Load msgs error", err));
  }, [currentAgent]);

  const { messages, status, error, sendMessage } = useChat({
    id: memory?.thread,
    transport: new DefaultChatTransport({
      api: `http://172.26.82.113:4111/chat/${currentAgent}`, // rota dinâmica
      prepareSendMessagesRequest: ({ id, messages, trigger, messageId }) => ({
        body: {
          messages,
          threadId: memory?.thread,
          resourceId: memory?.resource,
          trigger,
          messageId,
        },
      }),
    }),
    onError: (err) => console.error("Chat error", err),
  });

  // 🔹 sync messages back into your `chats` state (so you can keep the UI model consistent)
  useEffect(() => {
    if (messages.length && memory) {
      setChats((prev) => ({
        ...prev,
        [currentAgent]: messages.map((m) => ({
          role: m.role,
          text: m.parts?.[0]?.text || "",
        })),
      }));
    }
  }, [messages, currentAgent, memory]);

  return (
    <div className="h-full w-full flex items-center justify-center flex-col">
      {/* Sidebar */}
      <Sidebar>
        <div className="px-2 flex flex-col h-full justify-between">
          <div>
            <div className="flex justify-between items-center">
              <h2
                className="font-bold mb-3 pt-2 cursor-pointer"
                onClick={() => setIsWelcomeScreen(true)}
              >
                Usina AI - Agentes
              </h2>
              <SidebarTrigger className="flex-0" />
            </div>
            {agents.map((agent) => (
              <Button
                variant="secondary"
                key={agent.id}
                onClick={() => {
                  setCurrentAgent(agent.id);
                  setIsWelcomeScreen(false);
                }}
                className={`flex justify-start h-min w-full text-left px-2 py-1 rounded mb-1 hover:bg-slate-400 ${
                  currentAgent === agent.id
                    ? "bg-slate-600 text-white"
                    : "hover:bg-slate-400"
                }`}
              >
                <img
                  src={agent.photo ? agent.photo : undefined}
                  className="max-w-[30px]"
                  alt=""
                />
                <div>
                  <p className="margin-0">{agent.label}</p>
                  <small
                    className={`flex justify-start h-min w-full text-left font-normal ${
                      currentAgent === agent.id
                        ? "text-gray-200"
                        : "text-gray-500 "
                    }`}
                  >
                    {agent.description}
                  </small>
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
                <Trash2 color="red" />
                Resetar Conversas
              </Button>
            </div>
          </SidebarFooter>
        </div>
      </Sidebar>

      {/* Main */}
      <main className="flex-1 flex flex-col p-4 w-full h-full max-w-[600px]">
        {isWelcomeScreen && (
          <div className="flex items-center justify-center h-[100svh] flex-col gap-6">
            <h3 className="lg:text-4xl text-2xl text-center font-bold text-gray-700">
              Bem-vindo(a) à Usina AI Labs!
            </h3>
            <p className="text-center lg:text-xl text-sm text-gray-600">
              Este é um ambiente interativo construído exclusivamente para você
              conversar e conhecer alguns de nossos agentes. <br /> Fique à
              vontade para explorar!
            </p>
            <div className="flex flex-col gap-2 w-[80%] pt-6">
              <p className="inline-flex items-start lg:gap-4 gap-2 lg:text-lg text-xs text-gray-500">
                <SquareMousePointer size="30" />
                Navegue pelos agentes através do menu da esquerda e converse em
                tempo real
              </p>
              <small className="inline-flex  items-start lg:gap-4 gap-2 lg:text-lg text-xs text-gray-500">
                <Trash2 size="30" />
                Todo o histórico de conversas pode ser excluído através do botão
                inferior do menu
              </small>
            </div>
          </div>
        )}

        {!isWelcomeScreen && (
          <>
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto border rounded-lg p-3 mb-4">
              {[...(chats[currentAgent] || []),...messages].map((m) => (
                <div
                  key={m.id}
                  className={`mb-2 ${
                    m.role === "user"
                      ? "text-right text-blue-600"
                      : "text-left text-gray-700"
                  }`}
                >
                  <div
                    className={`inline-block max-w-[70%] p-2 rounded-lg shadow ${
                      m.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-blue-100/70"
                    }`}
                  >
                    {m.text || m.parts.map((part, index) =>
                      part.type === "text" ? (
                        <ReactMarkdown
                          key={index}
                          // className="prose prose-sm max-w-none"
                        >
                          {part.text}
                        </ReactMarkdown>
                      ) : null
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim()) {
                  sendMessage({ text: input });
                  setInput("");
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={status !== "ready"}
                className="flex-1 border rounded-lg p-2"
                placeholder={`Fale com ${
                  agents.find((a) => a.id === currentAgent)?.label
                }...`}
              />
              <Button type="submit" disabled={status !== "ready"}>
                Enviar
              </Button>
            </form>

            {error && (
              <p className="text-red-500 text-sm mt-2">⚠️ {error.message}</p>
            )}
          </>
        )}
      </main>

      {/* Reset dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar Conversas</DialogTitle>
          </DialogHeader>
          <p>
            Tem certeza que deseja apagar todas as conversas? Essa ação não pode
            ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                // aqui você pode limpar localmente se quiser
                window.location.reload();
              }}
            >
              Resetar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
