import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/qrcode")({
  component: QRCodePage,
});

function QRCodePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    setUrl(origin + "/");
  }, []);

  useEffect(() => {
    if (!url || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 480,
      margin: 2,
      color: { dark: "#5f1a1a", light: "#fdfaf2" },
    });
    QRCode.toDataURL(url, { width: 800, margin: 2, color: { dark: "#5f1a1a", light: "#fdfaf2" } })
      .then(setDataUrl);
  }, [url]);

  function handleDownload() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qrcode-casa-da-cultura.png";
    a.click();
  }

  function handlePrint() {
    const w = window.open("", "_blank");
    if (!w || !dataUrl) return;
    w.document.write(`
      <html><head><title>QR Code — Casa da Cultura</title>
      <style>
        body { font-family: Inter, sans-serif; text-align:center; padding:40px; color:#1b1010; }
        h1 { color:#5f1a1a; font-family: Georgia, serif; margin:0 0 6px; }
        .sub { color:#5f1a1a; opacity:.7; letter-spacing:.2em; text-transform:uppercase; font-size:11px; }
        img { max-width: 360px; margin: 30px auto; display:block; }
        p { color:#444; font-size:14px; max-width:380px; margin: 0 auto; }
      </style></head><body>
        <div class="sub">Secretaria de Cultura</div>
        <h1>Casa da Cultura</h1>
        <div class="sub">Siqueira Campos / PR</div>
        <img src="${dataUrl}" />
        <p>Aponte a câmera do celular para registrar sua visita.</p>
        <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    w.document.close();
  }

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Casa da Cultura", text: "Registre sua visita", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
      }
    } catch {/* user cancelled */}
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-primary">QR Code</h1>
        <p className="text-muted-foreground text-sm">Imprima e disponibilize na entrada da Casa da Cultura</p>
      </div>

      <div className="grid md:grid-cols-[auto,1fr] gap-6 items-start bg-card border rounded-xl p-6">
        <div className="bg-cream rounded-xl p-4 border flex items-center justify-center">
          <canvas ref={canvasRef} className="block max-w-full h-auto" />
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Link público</p>
            <div className="flex gap-2">
              <code className="flex-1 text-xs sm:text-sm bg-muted rounded-lg px-3 py-2 break-all">{url}</code>
              <Button size="icon" variant="outline" onClick={copyUrl} aria-label="Copiar"><Copy className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button onClick={handleDownload}><Download className="w-4 h-4 mr-2" /> Baixar PNG</Button>
            <Button variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" /> Imprimir</Button>
            <Button variant="outline" onClick={handleShare}><Share2 className="w-4 h-4 mr-2" /> Compartilhar</Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Visitantes que escanearem o QR Code serão direcionados ao formulário público de registro.
          </p>
        </div>
      </div>
    </div>
  );
}
