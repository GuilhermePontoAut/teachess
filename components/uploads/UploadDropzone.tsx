"use client";
/* eslint-disable @next/next/no-img-element -- object URLs temporários não passam pelo otimizador de imagens. */
import { ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";

export interface PreviewImage { file: File; previewUrl: string }
const formatBytes = (bytes: number) => bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
export const uploadRejectionMessage = (rejections: FileRejection[]): string => rejections.some(({ errors }) => errors.some((error) => error.code === "file-too-large")) ? "O arquivo excede o limite de 10 MB." : rejections.some(({ errors }) => errors.some((error) => error.code === "file-invalid-type")) ? "Formato inválido. Use PNG, JPEG ou WebP." : "Selecione somente uma imagem.";

export function UploadDropzone({ image, error, onChange, onError }: { image: PreviewImage | null; error?: string; onChange: (image: PreviewImage | null) => void; onError: (message: string) => void }) {
  const imageRef = useRef(image);
  useEffect(() => { imageRef.current = image; }, [image]);
  useEffect(() => () => { if (imageRef.current) URL.revokeObjectURL(imageRef.current.previewUrl); }, []);
  const replaceImage = ([file]: File[]) => {
    if (!file) return;
    if (image) URL.revokeObjectURL(image.previewUrl);
    onChange({ file, previewUrl: URL.createObjectURL(file) });
    onError("");
  };
  const remove = () => { if (image) URL.revokeObjectURL(image.previewUrl); onChange(null); };
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/webp": [".webp"] }, maxSize: 10 * 1024 * 1024, maxFiles: 1, multiple: false, noClick: Boolean(image), onDropAccepted: replaceImage, onDropRejected: (items) => onError(uploadRejectionMessage(items)) });
  return <section aria-labelledby="upload-image-title"><div className="flex items-end justify-between gap-3"><div><h2 id="upload-image-title" className="text-lg font-semibold">Imagem da posição</h2><p className="mt-1 text-sm text-muted">Uma imagem PNG, JPEG ou WebP, de até 10 MB.</p></div>{image && <button type="button" onClick={open} className="inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-semibold hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2"><RefreshCw size={15}/>Substituir</button>}</div>
    <div {...getRootProps({ role: "button", tabIndex: 0, "aria-label": "Selecionar ou arrastar uma imagem", className: `mt-3 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center outline-none focus-visible:ring-2 focus-visible:ring-neutral-700 ${isDragActive ? "border-neutral-950 bg-neutral-100" : "border-line-strong bg-neutral-50"}` })}><input {...getInputProps()}/><ImagePlus size={32} className="text-neutral-500"/><p className="mt-3 font-semibold">{isDragActive ? "Solte a imagem aqui" : image ? "Use Substituir para escolher outra imagem" : "Arraste uma imagem ou pressione para selecionar"}</p><p className="mt-1 text-sm text-muted">Somente uma posição por envio</p></div>
    {error && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{error}</p>}
    {image && <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white"><div className="aspect-video bg-neutral-100"><img src={image.previewUrl} alt={`Preview temporário de ${image.file.name}`} className="size-full object-contain"/></div><div className="flex items-center gap-2 p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{image.file.name}</p><p className="text-xs text-muted">{image.file.type} · {formatBytes(image.file.size)}</p></div><button type="button" onClick={remove} aria-label={`Remover ${image.file.name}`} className="rounded-lg p-2 text-red-700 hover:bg-red-50"><Trash2 size={16}/></button></div></div>}
  </section>;
}
