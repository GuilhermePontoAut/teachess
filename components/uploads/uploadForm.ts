import type { ImageOrigin, PositionSourceContext } from "@/lib/types/chess";

export interface UploadFormValues {
  title: string;
  imageOrigin: ImageOrigin | "";
  sourceContext: PositionSourceContext | "";
  sourceDetails: string;
  date: string;
  description: string;
  linkedGameId: string;
  tags: string[];
}
export type UploadFormErrors = Partial<Record<keyof UploadFormValues | "image", string>>;
export const emptyUploadForm = (): UploadFormValues => ({ title: "", imageOrigin: "", sourceContext: "", sourceDetails: "", date: new Date().toISOString().slice(0, 10), description: "", linkedGameId: "", tags: [] });
export function validateUpload(values: UploadFormValues, hasImage: boolean): UploadFormErrors {
  const errors: UploadFormErrors = {};
  if (!values.title.trim()) errors.title = "Informe um título.";
  if (!values.imageOrigin) errors.imageOrigin = "Selecione a origem da imagem.";
  if (!values.sourceContext) errors.sourceContext = "Selecione a plataforma ou o contexto.";
  if (values.sourceContext === "other" && !values.sourceDetails.trim()) errors.sourceDetails = "Informe os detalhes da plataforma ou do contexto.";
  if (!values.date) errors.date = "Informe a data.";
  if (values.tags.length > 10) errors.tags = "Adicione no máximo 10 tags.";
  if (!hasImage) errors.image = "Selecione uma imagem.";
  return errors;
}
