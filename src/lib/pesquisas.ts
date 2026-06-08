import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirebaseDb,
  orderBy,
  query,
  serverTimestamp,
} from "@/integrations/firebase/client";
import type { Visitante } from "./visitantes";

export const AVALIACOES = [
  { value: 5, emoji: "😍", label: "Excelente" },
  { value: 4, emoji: "😊", label: "Boa" },
  { value: 3, emoji: "😐", label: "Regular" },
  { value: 2, emoji: "😕", label: "Ruim" },
  { value: 1, emoji: "😡", label: "Muito ruim" },
] as const;

export type AvaliacaoValor = (typeof AVALIACOES)[number]["value"];

export type PesquisaSatisfacao = {
  id: string;
  visitante_id: string;
  visitante_nome: string;
  visitante_telefone: string;
  avaliacao: AvaliacaoValor;
  emoji: string;
  comentario_gostou: string;
  sugestao_melhoria: string;
  deseja_receber_eventos: boolean | null;
  data_resposta: string;
  mes: number;
  ano: number;
  created_at: string;
};

export type PesquisaInput = {
  visitante_id: string;
  avaliacao: AvaliacaoValor;
  emoji: string;
  comentario_gostou: string;
  sugestao_melhoria: string;
  deseja_receber_eventos: boolean | null;
};

export async function fetchVisitanteById(id: string): Promise<Visitante | null> {
  const snapshot = await getDoc(doc(getFirebaseDb(), "visitantes", id));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();

  return {
    id: snapshot.id,
    nome: data.nome ?? "",
    telefone: data.telefone ?? "",
    morador_siqueira_campos: Boolean(data.morador_siqueira_campos),
    cidade: data.cidade ?? null,
    estado: data.estado ?? null,
    data_visita: data.data_visita ?? "",
    hora_visita: data.hora_visita ?? "",
    dia_semana: Number(data.dia_semana ?? 0),
    mes: Number(data.mes ?? 0),
    ano: Number(data.ano ?? 0),
    created_at: data.created_at?.toDate?.().toISOString?.() ?? data.created_at ?? "",
  };
}

export async function createPesquisaSatisfacao(input: PesquisaInput) {
  const now = new Date();
  let visitante: Visitante | null = null;

  try {
    visitante = await fetchVisitanteById(input.visitante_id);
  } catch {
    visitante = null;
  }

  await addDoc(collection(getFirebaseDb(), "pesquisas_satisfacao"), {
    ...input,
    visitante_nome: visitante?.nome ?? "",
    visitante_telefone: visitante?.telefone ?? "",
    data_resposta: toDateInputValue(now),
    mes: Number(new Intl.DateTimeFormat("pt-BR", { month: "numeric", timeZone: "America/Sao_Paulo" }).format(now)),
    ano: Number(new Intl.DateTimeFormat("pt-BR", { year: "numeric", timeZone: "America/Sao_Paulo" }).format(now)),
    created_at: serverTimestamp(),
  });
}

export async function fetchAllPesquisas(): Promise<PesquisaSatisfacao[]> {
  const snapshot = await getDocs(
    query(collection(getFirebaseDb(), "pesquisas_satisfacao"), orderBy("created_at", "desc")),
  );

  return snapshot.docs.map((document) => {
    const data = document.data();
    const avaliacao = Number(data.avaliacao ?? 0) as AvaliacaoValor;
    const option = AVALIACOES.find((item) => item.value === avaliacao);

    return {
      id: document.id,
      visitante_id: data.visitante_id ?? "",
      visitante_nome: data.visitante_nome ?? "",
      visitante_telefone: data.visitante_telefone ?? "",
      avaliacao,
      emoji: data.emoji ?? option?.emoji ?? "",
      comentario_gostou: data.comentario_gostou ?? "",
      sugestao_melhoria: data.sugestao_melhoria ?? "",
      deseja_receber_eventos:
        typeof data.deseja_receber_eventos === "boolean" ? data.deseja_receber_eventos : null,
      data_resposta: data.data_resposta ?? "",
      mes: Number(data.mes ?? 0),
      ano: Number(data.ano ?? 0),
      created_at: data.created_at?.toDate?.().toISOString?.() ?? data.created_at ?? "",
    };
  });
}

function toDateInputValue(date: Date) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(date);

  const day = parts.find((part) => part.type === "day")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const year = parts.find((part) => part.type === "year")?.value;

  return `${year}-${month}-${day}`;
}
