import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ESPACOS, fetchAllVisitantes, getEspacoLabel, type Visitante } from "@/lib/visitantes";
import { exportPDF, exportXLSX, printRows, visitantesToRows } from "@/lib/exporters";

export const Route = createFileRoute("/_authenticated/admin/relatorios")({
  component: RelatoriosPage,
});

type TipoRelatorio = "diario" | "mensal" | "anual" | "periodo" | "espaco" | "cidade" | "estado" | "locais" | "fora" | "recorrentes";

function RelatoriosPage() {
  const { data: visitantes = [] } = useQuery({ queryKey: ["visitantes"], queryFn: fetchAllVisitantes });
  const [tipo, setTipo] = useState<TipoRelatorio>("diario");
  const today = new Date().toISOString().slice(0, 10);
  const [dia, setDia] = useState(today);
  const [mes, setMes] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [espaco, setEspaco] = useState("casa-da-cultura");

  const { titulo, data } = useMemo(() => filtrar(visitantes, tipo, { dia, mes, ano, inicio, fim, cidade, estado, espaco }),
    [visitantes, tipo, dia, mes, ano, inicio, fim, cidade, estado, espaco]);
  const rows = visitantesToRows(data);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-display text-3xl text-primary">Relatórios</h1>
        <p className="text-muted-foreground text-sm">Gere e exporte relatórios de visitação</p>
      </div>

      <Tabs value={tipo} onValueChange={(v) => setTipo(v as TipoRelatorio)}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="diario">Diário</TabsTrigger>
          <TabsTrigger value="mensal">Mensal</TabsTrigger>
          <TabsTrigger value="anual">Anual</TabsTrigger>
          <TabsTrigger value="periodo">Período</TabsTrigger>
          <TabsTrigger value="espaco">Espaço</TabsTrigger>
          <TabsTrigger value="cidade">Cidade</TabsTrigger>
          <TabsTrigger value="estado">Estado</TabsTrigger>
          <TabsTrigger value="locais">Locais</TabsTrigger>
          <TabsTrigger value="fora">De fora</TabsTrigger>
          <TabsTrigger value="recorrentes">Recorrentes</TabsTrigger>
        </TabsList>

        <div className="bg-card border rounded-xl p-5 mt-4 space-y-4">
          <TabsContent value="diario" className="m-0">
            <Field label="Data"><Input type="date" value={dia} onChange={(e) => setDia(e.target.value)} /></Field>
          </TabsContent>
          <TabsContent value="mensal" className="m-0 grid grid-cols-2 gap-3">
            <Field label="Mês"><Input type="number" min={1} max={12} value={mes} onChange={(e) => setMes(e.target.value)} /></Field>
            <Field label="Ano"><Input type="number" value={ano} onChange={(e) => setAno(e.target.value)} /></Field>
          </TabsContent>
          <TabsContent value="anual" className="m-0">
            <Field label="Ano"><Input type="number" value={ano} onChange={(e) => setAno(e.target.value)} /></Field>
          </TabsContent>
          <TabsContent value="periodo" className="m-0 grid grid-cols-2 gap-3">
            <Field label="De"><Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></Field>
            <Field label="Até"><Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} /></Field>
          </TabsContent>
          <TabsContent value="espaco" className="m-0">
            <Field label="Espaço">
              <Select value={espaco} onValueChange={setEspaco}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESPACOS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </TabsContent>
          <TabsContent value="cidade" className="m-0">
            <Field label="Cidade"><Input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Nome da cidade" /></Field>
          </TabsContent>
          <TabsContent value="estado" className="m-0">
            <Field label="UF"><Input value={estado} maxLength={2} onChange={(e) => setEstado(e.target.value.toUpperCase())} /></Field>
          </TabsContent>
          <TabsContent value="locais" className="m-0">
            <p className="text-sm text-muted-foreground">Lista todos os visitantes moradores de Siqueira Campos/PR.</p>
          </TabsContent>
          <TabsContent value="fora" className="m-0">
            <p className="text-sm text-muted-foreground">Lista todos os visitantes de outras cidades.</p>
          </TabsContent>
          <TabsContent value="recorrentes" className="m-0">
            <p className="text-sm text-muted-foreground">Visitantes (por telefone) com mais de uma visita registrada.</p>
          </TabsContent>
        </div>
      </Tabs>

      <div className="bg-card border rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold">{titulo}</h3>
            <p className="text-xs text-muted-foreground">{data.length} registro(s)</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => exportPDF(titulo, rows)}><Download className="w-4 h-4 mr-1.5" /> PDF</Button>
            <Button size="sm" variant="outline" onClick={() => exportXLSX(titulo, rows)}><FileSpreadsheet className="w-4 h-4 mr-1.5" /> Excel</Button>
            <Button size="sm" variant="outline" onClick={() => printRows(titulo, rows)}><Printer className="w-4 h-4 mr-1.5" /> Imprimir</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2">Nome</th>
                <th className="text-left px-3 py-2">Telefone</th>
                <th className="text-left px-3 py-2">Espaço</th>
                <th className="text-left px-3 py-2">Origem</th>
                <th className="text-left px-3 py-2">Data</th>
                <th className="text-left px-3 py-2">Hora</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Nenhum registro.</td></tr>
              )}
              {data.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{v.nome}</td>
                  <td className="px-3 py-2">{v.telefone}</td>
                  <td className="px-3 py-2">{getEspacoLabel(v.espaco)}</td>
                  <td className="px-3 py-2">{v.morador_siqueira_campos ? "Siqueira Campos" : `${v.cidade}/${v.estado}`}</td>
                  <td className="px-3 py-2">{formatDate(v.data_visita)}</td>
                  <td className="px-3 py-2">{v.hora_visita.slice(0, 5)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function filtrar(v: Visitante[], tipo: TipoRelatorio, p: {
  dia: string; mes: string; ano: string; inicio: string; fim: string; cidade: string; estado: string; espaco: string;
}): { titulo: string; data: Visitante[] } {
  switch (tipo) {
    case "diario":
      return { titulo: `Relatório diário — ${formatDate(p.dia)}`, data: v.filter((x) => x.data_visita === p.dia) };
    case "mensal": {
      const m = Number(p.mes), a = Number(p.ano);
      return { titulo: `Relatório mensal — ${String(m).padStart(2, "0")}/${a}`,
        data: v.filter((x) => x.mes === m && x.ano === a) };
    }
    case "anual":
      return { titulo: `Relatório anual — ${p.ano}`, data: v.filter((x) => x.ano === Number(p.ano)) };
    case "periodo":
      return { titulo: `Relatório por período — ${p.inicio || "?"} a ${p.fim || "?"}`,
        data: v.filter((x) => (!p.inicio || x.data_visita >= p.inicio) && (!p.fim || x.data_visita <= p.fim)) };
    case "espaco":
      return { titulo: `Relatório por espaço — ${getEspacoLabel(p.espaco)}`,
        data: v.filter((x) => x.espaco === p.espaco) };
    case "cidade":
      return { titulo: `Relatório por cidade — ${p.cidade}`,
        data: v.filter((x) => !x.morador_siqueira_campos && (x.cidade ?? "").toLowerCase().includes(p.cidade.toLowerCase())) };
    case "estado":
      return { titulo: `Relatório por estado — ${p.estado}`,
        data: v.filter((x) => (x.estado ?? "").toLowerCase() === p.estado.toLowerCase()) };
    case "locais":
      return { titulo: "Visitantes locais (Siqueira Campos/PR)", data: v.filter((x) => x.morador_siqueira_campos) };
    case "fora":
      return { titulo: "Visitantes de outras cidades", data: v.filter((x) => !x.morador_siqueira_campos) };
    case "recorrentes": {
      const cnt = new Map<string, number>();
      v.forEach((x) => cnt.set(x.telefone, (cnt.get(x.telefone) ?? 0) + 1));
      return { titulo: "Visitantes recorrentes", data: v.filter((x) => (cnt.get(x.telefone) ?? 0) > 1) };
    }
  }
}
