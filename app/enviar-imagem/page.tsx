import type { Metadata } from "next";
import { UploadContent } from "@/components/uploads/UploadContent";
export const metadata:Metadata={title:"Enviar Imagem"};
export default function Page(){return <UploadContent/>}
