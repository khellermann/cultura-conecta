import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Calendar, CalendarDays, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import { fetchAllVisitantes, DIAS_SEMANA, MESES, type Visitante } from "@/lib/visitantes";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

const COLORS = ["oklch(0.36 0.13 18)", "oklch(0.74 0.13 78)", "oklch(0.55 0.10 40)", "oklch(0.62 0.12 150)", "oklch(0.50 0.15 260)"];

function Dashboard() {
  const { data: visitantes = [], isLoading } = useQuery({
    queryKey: ["visitantes"],
    queryFn: fetchAllVisitantes,
  });

  const stats = computeStats(visitantes);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-display text-3xl text-primary">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral da visitação</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Hoje" value={stats.hoje} icon={Calendar} accent />
        <StatCard label="Este mês" value={stats.mes} icon={CalendarDays} />
        <StatCard label="Este ano" value={stats.ano} icon={TrendingUp} />
        <StatCard label="Total geral" value={stats.total} icon={Users} />
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Carregando indicadores...</div>
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            <ChartCard title="Visitas nos últimos 30 dias">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={stats.porDia30}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke={COLORS[0]} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Por dia da semana">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.porDiaSemana}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill={COLORS[1]} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Visitas por mês (ano atual)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.porMes}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill={COLORS[0]} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Horários de maior movimento">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.porHora}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="hora" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Local x Visitantes de fora">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={stats.localFora} dataKey="value" nameKey="name" outerRadius={90} label>
                    {stats.localFora.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Comparativo anos">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.porAno}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill={COLORS[1]} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <RankingCard title="Top 10 cidades" items={stats.rankingCidades} />
            <RankingCard title="Top 10 estados" items={stats.rankingEstados} />
          </div>

          <ChartCard title="Últimos visitantes registrados">
            <div className="divide-y">
              {visitantes.slice(0, 8).map((v) => (
                <div key={v.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{v.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {v.telefone} • {v.morador_siqueira_campos ? "Siqueira Campos" : `${v.cidade}/${v.estado}`}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <p>{formatDate(v.data_visita)}</p>
                    <p>{v.hora_visita.slice(0, 5)}</p>
                  </div>
                </div>
              ))}
              {visitantes.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhum visitante registrado ainda.</p>
              )}
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: any; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${accent ? "bg-gradient-bordo text-primary-foreground border-transparent" : "bg-card"}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs uppercase tracking-wider ${accent ? "text-gold" : "text-muted-foreground"}`}>{label}</p>
        <Icon className={`w-4 h-4 ${accent ? "text-gold" : "text-primary"}`} />
      </div>
      <p className="font-display text-3xl sm:text-4xl mt-3">{value.toLocaleString("pt-BR")}</p>
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

function RankingCard({ title, items }: { title: string; items: { label: string; total: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.total));
  return (
    <div className="bg-card border rounded-xl p-5">
      <h3 className="font-semibold mb-4 text-sm">{title}</h3>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-xs text-muted-foreground">Sem dados ainda.</p>}
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="truncate">{item.label}</span>
              <span className="font-semibold text-primary">{item.total}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-bordo rounded-full" style={{ width: `${(item.total / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function computeStats(v: Visitante[]) {
  const tz = "America/Sao_Paulo";
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
  const todayStr = now.toISOString().slice(0, 10);
  const currMonth = now.getMonth() + 1;
  const currYear = now.getFullYear();

  const hoje = v.filter((x) => x.data_visita === todayStr).length;
  const mes = v.filter((x) => x.ano === currYear && x.mes === currMonth).length;
  const ano = v.filter((x) => x.ano === currYear).length;

  // Last 30 days
  const porDia30: { label: string; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    porDia30.push({
      label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      total: v.filter((x) => x.data_visita === key).length,
    });
  }

  const porDiaSemana = DIAS_SEMANA.map((label, idx) => ({
    label: label.slice(0, 3),
    total: v.filter((x) => x.dia_semana === idx).length,
  }));

  const porMes = MESES.map((label, idx) => ({
    label,
    total: v.filter((x) => x.ano === currYear && x.mes === idx + 1).length,
  }));

  const horasMap = new Map<number, number>();
  for (let h = 0; h < 24; h++) horasMap.set(h, 0);
  v.forEach((x) => {
    const h = parseInt(x.hora_visita.slice(0, 2), 10);
    horasMap.set(h, (horasMap.get(h) ?? 0) + 1);
  });
  const porHora = Array.from(horasMap).map(([h, total]) => ({ hora: `${String(h).padStart(2, "0")}h`, total }));

  const local = v.filter((x) => x.morador_siqueira_campos).length;
  const fora = v.length - local;
  const localFora = [
    { name: "Siqueira Campos", value: local },
    { name: "Outras cidades", value: fora },
  ];

  const anosMap = new Map<number, number>();
  v.forEach((x) => anosMap.set(x.ano, (anosMap.get(x.ano) ?? 0) + 1));
  const porAno = Array.from(anosMap).map(([ano, total]) => ({ ano: String(ano), total })).sort((a, b) => a.ano.localeCompare(b.ano));

  const cidadeMap = new Map<string, number>();
  v.filter((x) => !x.morador_siqueira_campos && x.cidade).forEach((x) => {
    const key = `${x.cidade}/${x.estado ?? ""}`;
    cidadeMap.set(key, (cidadeMap.get(key) ?? 0) + 1);
  });
  const rankingCidades = Array.from(cidadeMap).map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total).slice(0, 10);

  const estadoMap = new Map<string, number>();
  v.filter((x) => !x.morador_siqueira_campos && x.estado).forEach((x) => {
    estadoMap.set(x.estado!, (estadoMap.get(x.estado!) ?? 0) + 1);
  });
  const rankingEstados = Array.from(estadoMap).map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total).slice(0, 10);

  return {
    hoje, mes, ano, total: v.length,
    porDia30, porDiaSemana, porMes, porHora, localFora, porAno, rankingCidades, rankingEstados,
  };
}
