"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { FormFieldError } from "./FormFieldError";

export function TagInput({ tags, error, onChange, maxTags = 10 }: { tags: string[]; error?: string; onChange: (tags: string[]) => void; maxTags?: number }) {
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState("");
  const addTag = () => {
    const tag = draft.trim();
    if (!tag) { setLocalError("Digite uma tag antes de adicionar."); return; }
    if (tags.some((current) => current.toLocaleLowerCase("pt-BR") === tag.toLocaleLowerCase("pt-BR"))) { setLocalError("Esta tag já foi adicionada."); return; }
    if (tags.length >= maxTags) { setLocalError(`Adicione no máximo ${maxTags} tags.`); return; }
    onChange([...tags, tag]); setDraft(""); setLocalError("");
  };
  const message = localError || error;
  return <div className="sm:col-span-2"><label htmlFor="tag-draft" className="block text-sm font-semibold text-neutral-900">Tags</label><p id="tags-help" className="mt-1 text-sm text-muted">Use até {maxTags} tags para facilitar buscas e organização.</p><div className="mt-2 flex flex-col gap-2 sm:flex-row"><input id="tag-draft" value={draft} onChange={(event) => { setDraft(event.target.value); setLocalError(""); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} aria-describedby={`tags-help${message ? " tags-error" : ""}`} className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-neutral-700 focus:ring-2 focus:ring-neutral-300" placeholder="Ex.: tática" /><button type="button" onClick={addTag} disabled={tags.length >= maxTags} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50"><Plus size={16} aria-hidden="true" />Adicionar</button></div><FormFieldError id="tags-error" message={message} />{tags.length > 0 && <ul aria-label="Tags adicionadas" className="mt-3 flex flex-wrap gap-2">{tags.map((tag) => <li key={tag.toLocaleLowerCase("pt-BR")} className="inline-flex items-center gap-1 rounded-full bg-neutral-900 py-1 pl-3 pr-1.5 text-sm text-white"><span>{tag}</span><button type="button" onClick={() => onChange(tags.filter((current) => current !== tag))} aria-label={`Remover tag ${tag}`} className="rounded-full p-1 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"><X size={14} aria-hidden="true" /></button></li>)}</ul>}</div>;
}
