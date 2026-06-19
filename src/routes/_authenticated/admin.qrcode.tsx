import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { BookOpen, Building2, Copy, Download, Landmark, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ESPACOS, type EspacoVisita } from "@/lib/visitantes";
import { toast } from "sonner";
import culturaLogo from "@/assets/cultura-logo-horizontal.png";

export const Route = createFileRoute("/_authenticated/admin/qrcode")({
  component: QRCodePage,
});

const ICONS = {
  museu: Landmark,
  biblioteca: BookOpen,
  "casa-da-cultura": Building2,
} satisfies Record<EspacoVisita, typeof Building2>;

function QRCodePage() {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-primary">QR Codes por espaço</h1>
        <p className="text-muted-foreground text-sm">
          Imprima o código correspondente e disponibilize na entrada de cada espaço.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {ESPACOS.map((espaco) => (
          <QRCodeCard
            key={espaco.value}
            espaco={espaco.value}
            label={espaco.label}
            url={origin ? `${origin}/?espaco=${espaco.value}` : ""}
          />
        ))}
      </div>

      <div className="rounded-lg border bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
        Cada link registra automaticamente o espaço visitado. O visitante não precisa escolher o local no formulário.
      </div>
    </div>
  );
}

function QRCodeCard({
  espaco,
  label,
  url,
}: {
  espaco: EspacoVisita;
  label: string;
  url: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState("");
  const Icon = ICONS[espaco];

  useEffect(() => {
    if (!url || !canvasRef.current) return;

    const options = {
      width: 420,
      margin: 2,
      color: { dark: "#5f1a1a", light: "#fdfaf2" },
    };

    QRCode.toCanvas(canvasRef.current, url, options);
    QRCode.toDataURL(url, { ...options, width: 800 }).then(setDataUrl);
  }, [url]);

  function handleDownload() {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `qrcode-${espaco}.png`;
    link.click();
  }

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !dataUrl) return;

    printWindow.document.write(`
      <html><head><title>QR Code - ${label}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm; }
        * { box-sizing: border-box; }
        html, body {
          width: 100%;
          height: 100%;
        }
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          color: #1b1010;
          margin: 0;
          background: #fff;
          overflow: hidden;
        }
        .poster {
          width: 100%;
          height: 277mm;
          padding: 7mm 10mm 5mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: hidden;
        }
        .logo {
          display: block;
          width: 126mm;
          max-width: 82%;
          height: auto;
          margin: 0 auto 5mm;
        }
        .divider {
          width: 42mm;
          height: 2px;
          background: #bf9245;
          margin-bottom: 5mm;
        }
        .eyebrow {
          color: #5f1a1a;
          letter-spacing: .22em;
          text-transform: uppercase;
          font-size: 11px;
          font-weight: 700;
        }
        h1 {
          color: #5f1a1a;
          font-family: Georgia, serif;
          margin: 2mm 0 1.5mm;
          font-size: 32px;
        }
        .location {
          color: #4b4545;
          letter-spacing: .16em;
          text-transform: uppercase;
          font-size: 11px;
        }
        .qr-frame {
          margin: 7mm auto 5mm;
          padding: 0;
        }
        .qr {
          display: block;
          width: 86mm;
          height: 86mm;
        }
        .instruction {
          color: #302a2a;
          font-family: Georgia, serif;
          font-size: 20px;
          font-weight: 700;
          max-width: 130mm;
          margin: 0 auto 2mm;
        }
        .support {
          color: #666;
          font-size: 13px;
          max-width: 118mm;
          margin: 0 auto;
          line-height: 1.5;
        }
        .footer {
          color: #5f1a1a;
          font-size: 10px;
          letter-spacing: .12em;
          text-transform: uppercase;
          margin-top: auto;
          padding-top: 5mm;
        }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      </style></head><body>
        <main class="poster">
          <img class="logo" src="${culturaLogo}" alt="Secretaria Municipal de Cultura" />
          <div class="divider"></div>
          <div class="eyebrow">Registro de visita</div>
          <h1>${label}</h1>
          <div class="location">Siqueira Campos / PR</div>
          <div class="qr-frame">
            <img class="qr" src="${dataUrl}" alt="QR Code ${label}" />
          </div>
          <p class="instruction">Sua visita faz parte da nossa história.</p>
          <p class="support">Aponte a câmera do celular para o QR Code e registre sua presença em poucos segundos.</p>
          <div class="footer">Secretaria Municipal de Cultura</div>
        </main>
        <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
  }

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${label} - Registro de visita`,
          text: `Registre sua visita ao espaço ${label}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(`Link do ${label} copiado!`);
      }
    } catch {
      // O compartilhamento pode ser cancelado pelo usuário.
    }
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(url);
    toast.success(`Link do ${label} copiado`);
  }

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center gap-3 border-b px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Espaço</p>
          <h2 className="font-display text-xl text-primary">{label}</h2>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-center rounded-lg border bg-cream p-3">
          <canvas ref={canvasRef} className="block h-auto w-full max-w-[280px]" />
        </div>

        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Link público</p>
          <div className="flex gap-2">
            <code className="min-w-0 flex-1 break-all rounded-md bg-muted px-3 py-2 text-xs">{url}</code>
            <Button size="icon" variant="outline" onClick={copyUrl} aria-label={`Copiar link do ${label}`}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button size="sm" onClick={handleDownload} title="Baixar PNG">
            <Download className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Baixar</span>
          </Button>
          <Button size="sm" variant="outline" onClick={handlePrint} title="Imprimir">
            <Printer className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Imprimir</span>
          </Button>
          <Button size="sm" variant="outline" onClick={handleShare} title="Compartilhar">
            <Share2 className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Enviar</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
