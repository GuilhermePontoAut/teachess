import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { buttonBase } from "./play";
import type { ChatMessage } from "@/lib/types/play";

const quickMessages = ["Boa partida!", "Bom lance.", "Obrigado pela partida."];

export function SimulatedChat({ messages, opponentName, onSend }: { messages: ChatMessage[]; opponentName: string; onSend: (text: string) => void }) {
  const [draft, setDraft] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const lastMessage = messages.at(-1);

  useEffect(() => {
    if (!messages.length) { initializedRef.current = true; return; }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = initializedRef.current && !reducedMotion ? "smooth" : "auto";
    const container = messagesContainerRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior });
    else messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    initializedRef.current = true;
  }, [lastMessage?.id, messages.length]);

  const send = (text: string) => { const clean = text.trim(); if (!clean) return; onSend(clean); setDraft(""); };
  const submit = (event: FormEvent) => { event.preventDefault(); send(draft); };
  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(draft); } };
  const latestAnnouncement = lastMessage ? `${lastMessage.sender === "self" ? "Você" : lastMessage.sender === "opponent" ? `${opponentName}, simulação` : "Sistema"}: ${lastMessage.text}` : "";

  return <section aria-labelledby="chat-title" className="rounded-2xl border border-line bg-surface p-4">
    <div className="flex items-center gap-2"><MessageCircle size={18} aria-hidden="true"/><h2 id="chat-title" className="font-semibold">Chat da partida</h2></div>
    <p className="mt-1 text-xs leading-5 text-muted">Chat local de demonstração. Nenhuma mensagem é enviada a outro usuário. As mensagens permanecem até o encerramento da partida.</p>
    <div ref={messagesContainerRef} className={`mt-3 max-h-44 min-h-24 overflow-y-auto rounded-xl bg-neutral-50 p-3 ${messages.length ? "space-y-2" : "flex items-center justify-center"}`}>
      {messages.length ? messages.map((message) => { const label = message.sender === "self" ? "Você" : message.sender === "opponent" ? `${opponentName} (simulação)` : "Sistema"; const style = message.sender === "self" ? "ml-auto border-green-600 bg-green-50 text-green-950" : message.sender === "opponent" ? "mr-auto border-red-500 bg-red-50 text-red-950" : "mx-auto border-neutral-400 bg-neutral-100 text-neutral-900"; return <div key={message.id} className={`max-w-[90%] rounded-lg border px-3 py-2 text-sm ${style}`}><span className="block text-xs font-bold">{label}</span><span>{message.text}</span></div>; }) : <p className="text-center text-sm text-muted">Nenhuma mensagem enviada. Use uma sugestão ou escreva sua primeira mensagem.</p>}
      <div ref={messagesEndRef} aria-hidden="true" className="h-px"/>
    </div>
    <span className="sr-only" aria-live="polite" aria-atomic="true">{latestAnnouncement}</span>
    {!messages.length && <div className="mt-3 flex flex-wrap gap-2" aria-label="Sugestões para a primeira mensagem">{quickMessages.map((message) => <button key={message} type="button" onClick={() => send(message)} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-focus">{message}</button>)}</div>}
    <form onSubmit={submit} className="mt-3 flex gap-2"><label className="min-w-0 flex-1"><span className="sr-only">Mensagem do chat</span><input value={draft} maxLength={160} onKeyDown={keyDown} onChange={(event) => setDraft(event.target.value)} placeholder="Escreva uma mensagem" className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-focus"/></label><button type="submit" disabled={!draft.trim()} aria-label="Enviar mensagem local" className={`${buttonBase} bg-neutral-950 text-white`}><Send size={17} aria-hidden="true"/></button></form><p className="mt-1 text-right text-xs text-muted">{draft.length}/160</p>
  </section>;
}
