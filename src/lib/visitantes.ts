import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirebaseDb,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "@/integrations/firebase/client";

export type Visitante = {
  id: string;
  nome: string;
  telefone: string;
  morador_siqueira_campos: boolean;
  cidade: string | null;
  estado: string | null;
  data_visita: string;
  hora_visita: string;
  dia_semana: number;
  mes: number;
  ano: number;
  created_at: string;
};

export type VisitanteInput = {
  nome: string;
  telefone: string;
  morador_siqueira_campos: boolean;
  cidade: string | null;
  estado: string | null;
};

export const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export async function fetchAllVisitantes(): Promise<Visitante[]> {
  const snapshot = await getDocs(
    query(collection(getFirebaseDb(), "visitantes"), orderBy("created_at", "desc")),
  );

  return snapshot.docs.map((document) => {
    const data = document.data();
    return {
      id: document.id,
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
  });
}

export async function createVisitante(input: VisitanteInput) {
  const now = new Date();

  const document = await addDoc(collection(getFirebaseDb(), "visitantes"), {
    ...input,
    data_visita: toDateInputValue(now),
    hora_visita: now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "America/Sao_Paulo",
    }),
    dia_semana: Number(
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        timeZone: "America/Sao_Paulo",
      })
        .format(now)
        .replace(/Sun|Mon|Tue|Wed|Thu|Fri|Sat/, (day) =>
          String(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day)),
        ),
    ),
    mes: Number(
      new Intl.DateTimeFormat("pt-BR", {
        month: "numeric",
        timeZone: "America/Sao_Paulo",
      }).format(now),
    ),
    ano: Number(
      new Intl.DateTimeFormat("pt-BR", {
        year: "numeric",
        timeZone: "America/Sao_Paulo",
      }).format(now),
    ),
    created_at: serverTimestamp(),
  });

  return document.id;
}

export async function updateVisitante(id: string, input: VisitanteInput) {
  await updateDoc(doc(getFirebaseDb(), "visitantes", id), input);
}

export async function deleteVisitante(id: string) {
  await deleteDoc(doc(getFirebaseDb(), "visitantes", id));
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
