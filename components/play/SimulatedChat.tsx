import { FormEvent, KeyboardEvent, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { buttonBase } from "./play";

interface ChatMessage { id: number; author: string; text: string }
const quickMessages = ["Boa partida!", "Bom lance!", "Obrigado!"];
const exampleMessages: ChatMessage[] = [
  { id: 1, author: "Exemplo", text: "Boa partida!" },
  { id: 2, author: "Exemplo", text: "Bom lance." },
  { id: 3, author: "Exemplo", text: "Obrigado pela partida." },
];

export function SimulatedChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(exampleMessages);
  const [draft, setDraft] = useState("");
  const send = (text: string) => { const clean = text.trim(); if (!clean) return; setMessages((current) => [...current, { id: Date.now() + current.length, author: "Você", text: clean.slice(0, 160) }]); setDraft(""); };
  const submit = (event: FormEvent) => { event.preventDefault(); send(draft); };
  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(draft); } };
  return <section aria-labelledby="chat-title" className="rounded-2xl border border-line bg-surface p-4"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><MessageCircle size={18} aria-hidden="true"/><h2 id="chat-title" className="font-semibold">Chat da partida</h2></div><button type="button" onClick={() => setMessages([])} className="text-xs font-semibold text-muted underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-focus">Limpar</button></div><p className="mt-1 text-xs leading-5 text-muted">Chat local de demonstração. Nenhuma mensagem é enviada a outro usuário.</p><div aria-live="polite" className="mt-3 max-h-44 min-h-24 space-y-2 overflow-y-auto rounded-xl bg-neutral-50 p-3">{messages.length ? messages.map((message) => <div key={message.id} className="rounded-lg border border-line bg-white px-3 py-2 text-sm"><span className="font-semibold">{message.author}:</span> {message.text}</div>) : <p className="py-6 text-center text-sm text-muted">Chat vazio. Envie uma mensagem local.</p>}</div><div className="mt-3 flex flex-wrap gap-2">{quickMessages.map((message) => <button key={message} type="button" onClick={() => send(message)} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-focus">{message}</button>)}</div><form onSubmit={submit} className="mt-3 flex gap-2"><label className="min-w-0 flex-1"><span className="sr-only">Mensagem do chat</span><input value={draft} maxLength={160} onKeyDown={keyDown} onChange={(event) => setDraft(event.target.value)} placeholder="Escreva uma mensagem" className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-focus"/></label><button type="submit" disabled={!draft.trim()} aria-label="Enviar mensagem local" className={`${buttonBase} bg-neutral-950 text-white`}><Send size={17}/></button></form><p className="mt-1 text-right text-xs text-muted">{draft.length}/160</p></section>;
}
