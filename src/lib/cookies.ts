// lib/cookies.ts
import Cookies from "js-cookie";

type AgentMemory = {
  thread: string;
  resource: string;
};

export function getAgentMemory(agentId: string): AgentMemory | null {
  const cookie = Cookies.get("agentMemory");
  if (!cookie) return null;
  try {
    const parsed = JSON.parse(cookie);
    return parsed[agentId] || null;
  } catch {
    return null;
  }
}

export function setAgentMemory(agentId: string, memory: AgentMemory) {
  const cookie = Cookies.get("agentMemory");
  let parsed: Record<string, AgentMemory> = {};
  if (cookie) {
    try {
      parsed = JSON.parse(cookie);
    } catch {
      parsed = {};
    }
  }
  parsed[agentId] = memory;
  Cookies.set("agentMemory", JSON.stringify(parsed), { expires: 7 }); // keep for 7 days
}
