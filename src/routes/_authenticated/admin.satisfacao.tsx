import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, MessageSquareText, SmilePlus, Star, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AVALIACOES, fetchAllPesquisas, type PesquisaSatisfacao } from "@/lib/pesquisas";
import { exportPDF, exportXLSX, pesquisasToRows } from "@/lib/exporters";

export const Route = createFileRoute("/_authenticated/admin/satisfacao")({
  component: SatisfacaoPage,
});

function SatisfacaoPage() {
  const { data: pesquisas = [], isLoading } = useQuery({
    queryKey: ["pesquisas_satisfacao"],
    queryFn: fetchAllPesquisas,
  });
  const today = new Date().toISOString().slice(0, 10);
  const [dia, setDia] = useState("");
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  const filtered = useMemo(() => {
    return pesquisas.filter((pesquisa) => {
      if (dia && pesquisa.data_resposta !== dia) return false;
      if (mes && pesquisa.mes !== Number(mes)) return false;
      if (ano && pesquisa.ano !== Number(ano)) return false;
      if (inicio && pesquisa.data_resposta < inicio) return false;
      if (fim && pesquisa.data_resposta > fim) return false;
      return true;
    });
  }, [pesquisas, dia, mes, ano, inicio, fim]);

  const stats = useMemo(() => computeStats(filtered), [filtered]);
  const rows = pesquisasToRows(filtered);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-primary">Satisfação</h1>
          <p className="text-muted-foreground text-sm">
            Acompanhe avaliações, comentários e sugestões dos visitantes.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => exportPDF("Pesquisas de satisfação", rows)}>
            <Download className="w-4 h-4 mr-1.5" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportXLSX("Pesquisas de satisfação", rows)}>
            <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Excel
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Field label="Dia"><Input type="date" value={dia} max={today} onChange={(e) => setDia(e.target.value)} /></Field>
        <Field label="Mês"><Input type="number" min={1} max={12} value={mes} onChange={(e) => setMes(e.target.value)} placeholder="1-12" /></Field>
        <Field label="Ano"><Input type="number" value={ano} onChange={(e) => setAno(e.target.value)} placeholder="2026" /></Field>
        <Field label="De"><Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></Field>
        <Field label="Até"><Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} /></Field>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Média geral" value={stats.media ? stats.media.toFixed(1) : "0.0"} icon={Star} accent />
        <StatCard label="Respostas" value={filtered.length} icon={SmilePlus} />
        <StatCard label="Satisfeitos" value={`${stats.percentualSatisfeitos}%`} icon={TrendingUp} />
        <StatCard label="Comentários" value={stats.comentarios} icon={MessageSquareText} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Quantidade por avaliação">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.porEmoji}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#bf9245" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Satisfação ao longo do tempo">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.porDia}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="media" stroke="#5f1a1a" strokeWidth={2.5} dot />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Dias com melhor avaliação">
          <div className="space-y-3">
            {stats.rankingDias.length === 0 && <p className="text-sm text-muted-foreground">Sem dados ainda.</p>}
            {stats.rankingDias.map((item) => (
              <div key={item.data} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{formatDate(item.data)}</p>
                  <p className="text-xs text-muted-foreground">{item.total} resposta(s)</p>
                </div>
                <span className="text-primary font-semibold">{item.media.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Comentários e sugestões recentes">
          <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
            {filtered.filter(hasComment).length === 0 && <p className="text-sm text-muted-foreground">Nenhum comentário recebido.</p>}
            {filtered.filter(hasComment).slice(0, 10).map((pesquisa) => (
              <div key={pesquisa.id} className="border-b pb-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium truncate">{pesquisa.visitante_nome || "Visitante"}</p>
                  <span className="text-2xl">{pesquisa.emoji}</span>
                </div>
                {pesquisa.comentario_gostou && (
                  <p className="text-sm mt-1"><span className="font-semibold">Gostou:</span> {pesquisa.comentario_gostou}</p>
                )}
                {pesquisa.sugestao_melhoria && (
                  <p className="text-sm mt-1"><span className="font-semibold">Sugestão:</span> {pesquisa.sugestao_melhoria}</p>
                )}
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-5 border-b">
          <h3 className="font-semibold">Respostas da pesquisa</h3>
          <p className="text-xs text-muted-foreground">{filtered.length} registro(s)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Visitante</th>
                <th className="text-left px-4 py-3">Avaliação</th>
                <th className="text-left px-4 py-3">Eventos</th>
                <th className="text-left px-4 py-3">Comentário</th>
                <th className="text-left px-4 py-3">Sugestão</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>}
              {!isLoading && filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhuma resposta encontrada.</td></tr>}
              {filtered.map((pesquisa) => (
                <tr key={pesquisa.id} className="border-t">
                  <td className="px-4 py-3">{formatDate(pesquisa.data_resposta)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{pesquisa.visitante_nome || "Visitante"}</p>
                    <p className="text-xs text-muted-foreground">{pesquisa.visitante_telefone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span className="text-2xl">{pesquisa.emoji}</span>
                      {AVALIACOES.find((item) => item.value === pesquisa.avaliacao)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">{pesquisa.deseja_receber_eventos == null ? "-" : pesquisa.deseja_receber_eventos ? "Sim" : "Não"}</td>
                  <td className="px-4 py-3 min-w-56">{pesquisa.comentario_gostou || "-"}</td>
                  <td className="px-4 py-3 min-w-56">{pesquisa.sugestao_melhoria || "-"}</td>
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

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: any; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "bg-gradient-bordo text-primary-foreground border-transparent" : "bg-card"}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs uppercase tracking-wider ${accent ? "text-gold" : "text-muted-foreground"}`}>{label}</p>
        <Icon className={`w-4 h-4 ${accent ? "text-gold" : "text-primary"}`} />
      </div>
      <p className="font-display text-3xl mt-3">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-xl p-5">
      <h3 className="font-semibold mb-4 text-sm">{title}</h3>
      {children}
    </div>
  );
}

function computeStats(pesquisas: PesquisaSatisfacao[]) {
  const total = pesquisas.length;
  const media = total ? pesquisas.reduce((sum, item) => sum + item.avaliacao, 0) / total : 0;
  const satisfeitos = pesquisas.filter((item) => item.avaliacao >= 4).length;
  const comentarios = pesquisas.filter(hasComment).length;

  const porEmoji = AVALIACOES.map((option) => ({
    label: `${option.emoji} ${option.label}`,
    total: pesquisas.filter((item) => item.avaliacao === option.value).length,
  }));

  const porDiaMap = new Map<string, { soma: number; total: number }>();
  pesquisas.forEach((pesquisa) => {
    const current = porDiaMap.get(pesquisa.data_resposta) ?? { soma: 0, total: 0 };
    current.soma += pesquisa.avaliacao;
    current.total += 1;
    porDiaMap.set(pesquisa.data_resposta, current);
  });
  const porDia = Array.from(porDiaMap)
    .map(([data, value]) => ({
      data,
      label: formatDate(data),
      media: Number((value.soma / value.total).toFixed(2)),
      total: value.total,
    }))
    .sort((a, b) => a.data.localeCompare(b.data));

  const rankingDias = [...porDia]
    .sort((a, b) => b.media - a.media || b.total - a.total)
    .slice(0, 5);

  return {
    media,
    percentualSatisfeitos: total ? Math.round((satisfeitos / total) * 100) : 0,
    comentarios,
    porEmoji,
    porDia,
    rankingDias,
  };
}

function hasComment(pesquisa: PesquisaSatisfacao) {
  return Boolean(pesquisa.comentario_gostou || pesquisa.sugestao_melhoria);
}

function formatDate(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
