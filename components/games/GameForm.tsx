"use client";

import { Eraser, Save, X } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { DeleteGameDialog } from "./DeleteGameDialog";
import { FenField } from "./FenField";
import { FormFieldError } from "./FormFieldError";
import { GameFormSection } from "./GameFormSection";
import { type GameFormErrors, type GameFormValues, emptyGameFormValues, validateGameForm } from "./gameForm";
import { PgnField } from "./PgnField";
import { TagInput } from "./TagInput";

type TextFieldName = Exclude<keyof GameFormValues, "tags" | "playerColor" | "result" | "analysisStatus" | "externalSource" | "pgn" | "fen">;

interface GameFormProps {
  mode: "create" | "edit";
  initialValues: GameFormValues;
  onSubmit: (values: GameFormValues) => void | Promise<void>;
  onCancel: () => void;
}

const inputClass = "mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-700 focus:ring-2 focus:ring-neutral-300";

function RequiredMark() { return <span className="text-red-700" aria-hidden="true"> *</span>; }

export function GameForm({ mode, initialValues, onSubmit, onCancel }: GameFormProps) {
  const [values, setValues] = useState<GameFormValues>(initialValues);
  const [errors, setErrors] = useState<GameFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [dialog, setDialog] = useState<"cancel" | "clear" | null>(null);
  const initialSnapshot = useMemo(() => JSON.stringify(initialValues), [initialValues]);
  const dirty = JSON.stringify(values) !== initialSnapshot;

  const update = <K extends keyof GameFormValues>(field: K, value: GameFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const validateField = (field: keyof GameFormValues) => {
    const message = validateGameForm(values)[field];
    setErrors((current) => ({ ...current, [field]: message }));
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const nextErrors = validateGameForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setSubmitting(true);
    try { await onSubmit(values); } finally { setSubmitting(false); }
  };
  const handleCancel = () => { if (dirty) setDialog("cancel"); else onCancel(); };

  const textField = (name: TextFieldName, label: string, options: { required?: boolean; type?: string; help?: string; placeholder?: string; min?: number; max?: number; step?: number } = {}) => {
    const errorId = `${name}-error`;
    const helpId = options.help ? `${name}-help` : undefined;
    return <div><label htmlFor={name} className="block text-sm font-semibold text-neutral-900">{label}{options.required && <RequiredMark />}</label>{options.help && <p id={helpId} className="mt-1 text-sm text-muted">{options.help}</p>}<input id={name} name={name} type={options.type ?? "text"} value={values[name]} min={options.min} max={options.max} step={options.step} required={options.required} placeholder={options.placeholder} onChange={(event) => update(name, event.target.value)} onBlur={() => validateField(name)} aria-invalid={Boolean(errors[name])} aria-describedby={[helpId, errors[name] ? errorId : undefined].filter(Boolean).join(" ") || undefined} className={inputClass} /><FormFieldError id={errorId} message={errors[name]} /></div>;
  };

  return <>
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-muted"><span className="font-semibold text-red-700">*</span> Campos obrigatórios</p>
      <GameFormSection title="Informações gerais" description="Identifique quando e em qual contexto a partida foi disputada.">
        <div><label htmlFor="externalSource" className="block text-sm font-semibold text-neutral-900">Origem externa<RequiredMark /></label><select id="externalSource" value={values.externalSource} onChange={(event) => update("externalSource", event.target.value as GameFormValues["externalSource"])} onBlur={() => validateField("externalSource")} required aria-invalid={Boolean(errors.externalSource)} aria-describedby={errors.externalSource ? "externalSource-error" : undefined} className={inputClass}><option value="">Selecione</option><option value="presencial">Presencial</option><option value="chess.com">Chess.com</option><option value="lichess">Lichess</option><option value="outro">Outro</option></select><FormFieldError id="externalSource-error" message={errors.externalSource} /></div>
        {values.externalSource === "outro" && textField("externalSourceDetails", "Detalhes da origem", { required: true, placeholder: "Ex.: clube, torneio ou site" })}
        {textField("title", "Título ou nome da partida", { required: true, placeholder: "Ex.: Ataque no roque curto" })}
        {textField("event", "Evento", { placeholder: "Ex.: Clube TeaChess" })}
        {textField("date", "Data", { required: true, type: "date" })}
      </GameFormSection>

      <GameFormSection title="Jogadores e resultado" description="Registre o adversário, os ratings e o resultado sob sua perspectiva.">
        {textField("opponent", "Adversário", { required: true, placeholder: "Nome do adversário" })}
        {textField("playerRatingAtGame", "Rating do jogador na partida", { type: "number", min: 100, max: 3500, help: "Opcional. Se informado, use um valor entre 100 e 3500." })}
        {textField("opponentRatingAtGame", "Rating do adversário na partida", { type: "number", min: 100, max: 3500, help: "Opcional. Se informado, use um valor entre 100 e 3500." })}
        <div><label htmlFor="playerColor" className="block text-sm font-semibold text-neutral-900">Cor jogada<RequiredMark /></label><select id="playerColor" value={values.playerColor} onChange={(event) => update("playerColor", event.target.value as GameFormValues["playerColor"])} onBlur={() => validateField("playerColor")} required aria-invalid={Boolean(errors.playerColor)} aria-describedby={errors.playerColor ? "playerColor-error" : undefined} className={inputClass}><option value="">Selecione</option><option value="white">Brancas</option><option value="black">Pretas</option></select><FormFieldError id="playerColor-error" message={errors.playerColor} /></div>
        <div><label htmlFor="result" className="block text-sm font-semibold text-neutral-900">Resultado<RequiredMark /></label><select id="result" value={values.result} onChange={(event) => update("result", event.target.value as GameFormValues["result"])} onBlur={() => validateField("result")} required aria-invalid={Boolean(errors.result)} aria-describedby={errors.result ? "result-error" : undefined} className={inputClass}><option value="">Selecione</option><option value="win">Vitória</option><option value="loss">Derrota</option><option value="draw">Empate</option></select><FormFieldError id="result-error" message={errors.result} /></div>
      </GameFormSection>

      <GameFormSection title="Dados técnicos da partida" description="Informe a abertura, a duração e os indicadores simulados desta versão.">
        {textField("opening", "Abertura", { placeholder: "Ex.: Defesa Siciliana" })}
        {textField("moveCount", "Quantidade de lances", { type: "number", min: 1, step: 1, help: "Opcional. Se informada, deve ser um número inteiro maior que zero." })}
        {textField("accuracy", "Precisão simulada", { type: "number", min: 0, max: 100, step: 0.1, help: "Opcional. Use um valor entre 0 e 100." })}
        <div><label htmlFor="analysisStatus" className="block text-sm font-semibold text-neutral-900">Status da análise</label><p id="analysisStatus-help" className="mt-1 text-sm text-muted">Este status é apenas simulado.</p><select id="analysisStatus" value={values.analysisStatus} onChange={(event) => update("analysisStatus", event.target.value as GameFormValues["analysisStatus"])} aria-describedby="analysisStatus-help" className={inputClass}><option value="analyzed">Analisada</option><option value="pending">Pendente</option><option value="not_analyzed">Não analisada</option></select></div>
      </GameFormSection>

      <GameFormSection title="Notação e posição" description="Adicione a notação completa e, se desejar, uma posição relevante.">
        <PgnField value={values.pgn} error={errors.pgn} onChange={(value) => update("pgn", value)} />
        <FenField value={values.fen} error={errors.fen} onChange={(value) => update("fen", value)} />
        <div className="sm:col-span-2">{textField("onlineLink", "Link da partida online", { type: "url", placeholder: "https://...", help: "Opcional. Inclua o protocolo http:// ou https://." })}</div>
      </GameFormSection>

      <GameFormSection title="Observações e organização" description="Guarde seus aprendizados pessoais e facilite futuras buscas.">
        <div className="sm:col-span-2"><label htmlFor="notes" className="block text-sm font-semibold text-neutral-900">Observações pessoais</label><textarea id="notes" rows={5} value={values.notes} onChange={(event) => update("notes", event.target.value)} className={`${inputClass} resize-y`} placeholder="O que funcionou? O que merece revisão?" /></div>
        <TagInput tags={values.tags} error={errors.tags} onChange={(tags) => update("tags", tags)} />
      </GameFormSection>

      <div className="sticky bottom-3 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-line bg-white/95 p-4 shadow-lg backdrop-blur sm:static sm:flex-row sm:justify-between sm:shadow-sm">
        <div>{mode === "create" && <button type="button" onClick={() => dirty ? setDialog("clear") : undefined} disabled={!dirty || submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"><Eraser size={17} aria-hidden="true" />Limpar formulário</button>}</div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row"><button type="button" onClick={handleCancel} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50"><X size={17} aria-hidden="true" />Cancelar</button><button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-wait disabled:opacity-60"><Save size={17} aria-hidden="true" />{submitting ? "Salvando..." : mode === "create" ? "Adicionar partida externa" : "Salvar alterações"}</button></div>
      </div>
    </form>
    <DeleteGameDialog open={dialog === "cancel"} title="Descartar alterações?" description="As alterações feitas neste formulário serão perdidas." confirmLabel="Descartar alterações" destructive onCancel={() => setDialog(null)} onConfirm={() => { setDialog(null); onCancel(); }} />
    <DeleteGameDialog open={dialog === "clear"} title="Limpar formulário?" description="Todos os dados preenchidos serão apagados e esta ação não poderá ser desfeita." confirmLabel="Limpar dados" destructive onCancel={() => setDialog(null)} onConfirm={() => { setValues(emptyGameFormValues); setErrors({}); setDialog(null); }} />
  </>;
}
