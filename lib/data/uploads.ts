import type { UploadedPosition } from "@/lib/types/chess";

export const mockUploads: UploadedPosition[] = [
  { id:"upload-01", fileName:"final-torres.png", mimeType:"image/png", sizeInBytes:248320, previewUrl:"/uploads/mock-final-torres.png", status:"ready", extractedFen:"8/5pk1/4p1p1/3pP3/3P1P2/6P1/5K2/8 w - - 0 38", notes:"Posição cadastrada manualmente; sem OCR.", createdAt:"2026-06-12T14:20:00.000Z" },
  { id:"upload-02", fileName:"tabuleiro-clube.jpg", mimeType:"image/jpeg", sizeInBytes:512400, previewUrl:"/uploads/mock-tabuleiro-clube.jpg", status:"ready", extractedFen:"r1bq1rk1/pp2nppp/2pp1n2/2p5/2BPP3/2N2N2/PP3PPP/R1BQ1RK1 w - - 2 9", notes:"FEN simulado para futura revisão.", createdAt:"2026-06-03T19:10:00.000Z" },
  { id:"upload-03", fileName:"exercicio-27.webp", mimeType:"image/webp", sizeInBytes:187200, previewUrl:"/uploads/mock-exercicio-27.webp", status:"processing", extractedFen:null, notes:"Processamento apenas ilustrativo.", createdAt:"2026-05-28T09:00:00.000Z" },
  { id:"upload-04", fileName:"posicao-celular.jpg", mimeType:"image/jpeg", sizeInBytes:932100, previewUrl:null, status:"failed", extractedFen:null, notes:"Imagem inclinada; falha simulada, sem visão computacional.", createdAt:"2026-05-18T21:35:00.000Z" },
  { id:"upload-05", fileName:"estudo-peao-passado.png", mimeType:"image/png", sizeInBytes:324800, previewUrl:"/uploads/mock-peao-passado.png", status:"ready", extractedFen:"8/2k5/4P3/3K4/8/8/8/8 w - - 0 1", notes:"Diagrama simples para treino.", createdAt:"2026-05-07T16:45:00.000Z" },
  { id:"upload-06", fileName:"abertura-eslava.jpg", mimeType:"image/jpeg", sizeInBytes:448020, previewUrl:"/uploads/mock-eslava.jpg", status:"ready", extractedFen:"rnbqkb1r/pp3ppp/2p1pn2/3p4/2PP4/4PN2/PP3PPP/RNBQKB1R w KQkq - 2 5", notes:"Metadados e URL fictícia; arquivo não é persistido.", createdAt:"2026-04-30T11:25:00.000Z" },
];
