import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Search, Download, FileSpreadsheet, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  deleteVisitante,
  ESPACOS,
  fetchAllVisitantes,
  getEspacoLabel,
  updateVisitante,
  type Visitante,
} from "@/lib/visitantes";
import { exportPDF, exportXLSX, printRows, visitantesToRows } from "@/lib/exporters";

export const Route = createFileRoute("/_authenticated/admin/visitantes")({
  component: VisitantesPage,
});

function VisitantesPage() {
  const queryClient = useQueryClient();
  const { data: visitantes = [], isLoading } = useQuery({
    queryKey: ["visitantes"],
    queryFn: fetchAllVisitantes,
  });

  const [q, setQ] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [espaco, setEspaco] = useState("todos");
  const [editing, setEditing] = useState<Visitante | null>(null);
  const [deleting, setDeleting] = useState<Visitante | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return visitantes.filter((v) => {
      if (term && !v.nome.toLowerCase().includes(term) && !v.telefone.toLowerCase().includes(term)) return false;
      if (dataInicio && v.data_visita < dataInicio) return false;
      if (dataFim && v.data_visita > dataFim) return false;
      if (cidade && !(v.cidade ?? "").toLowerCase().includes(cidade.toLowerCase())) return false;
      if (estado && (v.estado ?? "").toLowerCase() !== estado.toLowerCase()) return false;
      if (espaco !== "todos" && v.espaco !== espaco) return false;
      return true;
    });
  }, [visitantes, q, dataInicio, dataFim, cidade, estado, espaco]);

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteVisitante(deleting.id);
      toast.success("Visitante excluído");
      queryClient.invalidateQueries({ queryKey: ["visitantes"] });
    } catch (error) {
      toast.error("Falha ao excluir: " + (error as Error).message);
    }
    setDeleting(null);
  }

  const rows = visitantesToRows(filtered);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-primary">Visitantes</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} de {visitantes.length} registro(s)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => exportPDF("Visitantes", rows)}>
            <Download className="w-4 h-4 mr-1.5" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportXLSX("Visitantes", rows)}>
            <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => printRows("Visitantes", rows)}>
            <Printer className="w-4 h-4 mr-1.5" /> Imprimir
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-4 grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou telefone" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} aria-label="Data início" />
        <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} aria-label="Data fim" />
        <Select value={espaco} onValueChange={setEspaco}>
          <SelectTrigger aria-label="Filtrar por espaço"><SelectValue placeholder="Espaço" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os espaços</SelectItem>
            {ESPACOS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
          <Input placeholder="UF" maxLength={2} value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase())} />
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">Telefone</th>
                <th className="text-left px-4 py-3">Espaço</th>
                <th className="text-left px-4 py-3">Origem</th>
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Hora</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Nenhum registro encontrado.</td></tr>
              )}
              {filtered.map((v) => (
                <tr key={v.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{v.nome}</td>
                  <td className="px-4 py-3">{v.telefone}</td>
                  <td className="px-4 py-3 font-medium">{getEspacoLabel(v.espaco)}</td>
                  <td className="px-4 py-3">
                    {v.morador_siqueira_campos ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Siqueira Campos</span>
                    ) : (
                      <span className="text-xs">{v.cidade}/{v.estado}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatDate(v.data_visita)}</td>
                  <td className="px-4 py-3">{v.hora_visita.slice(0, 5)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(v)} aria-label="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleting(v)} aria-label="Excluir">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EditDialog
        visitante={editing}
        onClose={() => setEditing(null)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["visitantes"] })}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir visitante?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleting?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditDialog({
  visitante, onClose, onSaved,
}: {
  visitante: Visitante | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [morador, setMorador] = useState(true);

  useMemo(() => {
    if (visitante) {
      setNome(visitante.nome);
      setTelefone(visitante.telefone);
      setCidade(visitante.cidade ?? "");
      setEstado(visitante.estado ?? "");
      setMorador(visitante.morador_siqueira_campos);
    }
  }, [visitante]);

  async function handleSave() {
    if (!visitante) return;
    try {
      await updateVisitante(visitante.id, {
        espaco: visitante.espaco,
        nome,
        telefone,
        morador_siqueira_campos: morador,
        cidade: morador ? null : cidade,
        estado: morador ? null : estado,
      });
    } catch (error) {
      return toast.error((error as Error).message);
    }
    toast.success("Atualizado");
    onSaved();
    onClose();
  }

  return (
    <Dialog open={!!visitante} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar visitante</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
          <div><Label>Telefone</Label><Input value={telefone} onChange={(e) => setTelefone(e.target.value)} /></div>
          <div className="flex items-center gap-2">
            <input id="mor" type="checkbox" checked={morador} onChange={(e) => setMorador(e.target.checked)} />
            <Label htmlFor="mor">Mora em Siqueira Campos/PR</Label>
          </div>
          {!morador && (
            <div className="grid grid-cols-[1fr,80px] gap-2">
              <div><Label>Cidade</Label><Input value={cidade} onChange={(e) => setCidade(e.target.value)} /></div>
              <div><Label>UF</Label><Input value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase())} maxLength={2} /></div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
