import { Chess } from "chess.js";
import type { UploadSource, UploadType } from "@/lib/types/chess";

export interface UploadFormValues { title: string; uploadType: UploadType | ""; uploadTypeDetails: string; date: string; source: UploadSource | ""; sourceDetails: string; description: string; manualFen: string; linkedGameId: string; tags: string[] }
export type UploadFormErrors = Partial<Record<keyof UploadFormValues | "files", string>>;
export const emptyUploadForm = (): UploadFormValues => ({ title:"", uploadType:"", uploadTypeDetails:"", date:new Date().toISOString().slice(0,10), source:"", sourceDetails:"", description:"", manualFen:"", linkedGameId:"", tags:[] });
export const isValidFen = (fen: string): boolean => { if (!fen.trim()) return true; try { new Chess(fen.trim()); return true; } catch { return false; } };
export function validateUpload(values: UploadFormValues, fileCount: number): UploadFormErrors {
  const errors: UploadFormErrors = {};
  if (!values.title.trim()) errors.title = "Informe um título.";
  if (!values.uploadType) errors.uploadType = "Selecione o tipo do envio.";
  if (values.uploadType === "other" && !values.uploadTypeDetails.trim()) errors.uploadTypeDetails = "Descreva o tipo do envio.";
  if (!values.date) errors.date = "Informe a data.";
  if (!values.source) errors.source = "Selecione a origem.";
  if (values.source === "outro" && !values.sourceDetails.trim()) errors.sourceDetails = "Detalhe a origem.";
  if (!isValidFen(values.manualFen)) errors.manualFen = "FEN inválido. Corrija a posição ou deixe o campo vazio.";
  if (values.tags.length > 10) errors.tags = "Adicione no máximo 10 tags.";
  if (values.uploadType === "game_sequence") { if (fileCount < 2 || fileCount > 10) errors.files = "Uma sequência deve conter entre 2 e 10 imagens."; }
  else if (fileCount !== 1) errors.files = "Selecione exatamente uma imagem para este tipo de envio.";
  return errors;
}
