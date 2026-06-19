import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { getEspacoLabel, type Visitante } from "./visitantes";
import { AVALIACOES, type PesquisaSatisfacao } from "./pesquisas";

export type ExportRow = Record<string, string | number>;

export function visitantesToRows(visitantes: Visitante[]): ExportRow[] {
  return visitantes.map((v) => ({
    Espaço: getEspacoLabel(v.espaco),
    Nome: v.nome,
    Telefone: v.telefone,
    "Mora em Siqueira Campos": v.morador_siqueira_campos ? "Sim" : "Não",
    Cidade: v.cidade ?? "",
    Estado: v.estado ?? "",
    Data: formatDate(v.data_visita),
    Hora: v.hora_visita.slice(0, 5),
  }));
}

export function pesquisasToRows(pesquisas: PesquisaSatisfacao[]): ExportRow[] {
  return pesquisas.map((p) => ({
    Data: formatDate(p.data_resposta),
    Espaço: getEspacoLabel(p.espaco),
    Visitante: p.visitante_nome,
    Telefone: p.visitante_telefone,
    Avaliação: AVALIACOES.find((item) => item.value === p.avaliacao)?.label ?? p.avaliacao,
    Emoji: p.emoji,
    "O que gostou": p.comentario_gostou,
    Sugestão: p.sugestao_melhoria,
    "Receber eventos": p.deseja_receber_eventos == null ? "" : p.deseja_receber_eventos ? "Sim" : "Não",
  }));
}

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function exportPDF(titulo: string, rows: ExportRow[]) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.setTextColor(95, 26, 26);
  doc.text("Casa da Cultura — Siqueira Campos/PR", 14, 16);
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(titulo, 14, 23);
  doc.setFontSize(9);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")} • ${rows.length} registro(s)`, 14, 28);

  const head = rows.length ? [Object.keys(rows[0])] : [["Sem dados"]];
  const body = rows.map((r) => Object.values(r).map(String));
  autoTable(doc, {
    startY: 33,
    head,
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [95, 26, 26], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 244, 235] },
  });

  doc.save(`${titulo.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}

export function exportXLSX(titulo: string, rows: ExportRow[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Visitantes");
  XLSX.writeFile(wb, `${titulo.replace(/\s+/g, "_").toLowerCase()}.xlsx`);
}

export function printRows(titulo: string, rows: ExportRow[]) {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  const head = rows.length ? Object.keys(rows[0]) : [];
  w.document.write(`
    <html><head><title>${titulo}</title>
    <style>
      body { font-family: Inter, sans-serif; padding: 24px; color:#1b1010; }
      h1 { color:#5f1a1a; margin:0 0 4px; font-family: Georgia, serif; }
      .meta { color:#666; font-size:12px; margin-bottom:16px; }
      table { width:100%; border-collapse:collapse; font-size:12px; }
      th { background:#5f1a1a; color:#fff; text-align:left; padding:8px; }
      td { padding:6px 8px; border-bottom:1px solid #eee; }
      tr:nth-child(even) td { background:#faf6ed; }
    </style></head><body>
      <h1>Casa da Cultura — Siqueira Campos/PR</h1>
      <div class="meta">${titulo} • ${new Date().toLocaleString("pt-BR")} • ${rows.length} registro(s)</div>
      <table>
        <thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((r) => `<tr>${head.map((h) => `<td>${r[h] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
      <script>window.print();</script>
    </body></html>
  `);
  w.document.close();
}
