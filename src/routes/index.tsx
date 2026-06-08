import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, MapPin, Phone, User, Building2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createVisitante } from "@/lib/visitantes";
import { toast } from "sonner";
import museumVisitBg from "@/assets/museum-visit-bg.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Registro de Visita - Casa da Cultura de Siqueira Campos/PR" },
      {
        name: "description",
        content:
          "Registre sua visita à Casa da Cultura de Siqueira Campos/PR em poucos segundos.",
      },
    ],
  }),
  component: VisitantePublicForm,
});

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome completo").max(120),
  telefone: z.string().trim().min(8, "Telefone inválido").max(20),
  morador: z.enum(["sim", "nao"], { errorMap: () => ({ message: "Selecione uma opção" }) }),
  cidade: z.string().trim().max(80).optional(),
  estado: z.string().trim().max(2).optional(),
}).refine((d) => d.morador === "sim" || (d.cidade && d.cidade.length >= 2), {
  message: "Informe a cidade",
  path: ["cidade"],
}).refine((d) => d.morador === "sim" || (d.estado && d.estado.length === 2), {
  message: "Selecione o estado",
  path: ["estado"],
});

function VisitantePublicForm() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [morador, setMorador] = useState<"sim" | "nao" | "">("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function formatPhone(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 10) return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) =>
      [a && `(${a}`, a && a.length === 2 ? ") " : "", b, c && `-${c}`].filter(Boolean).join(""));
    return d.replace(/(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ nome, telefone, morador: morador || undefined, cidade, estado });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Verifique os campos");
      return;
    }
    setLoading(true);

    const recentKey = `lastVisit:${telefone.replace(/\D/g, "")}`;
    const last = typeof window !== "undefined" ? Number(localStorage.getItem(recentKey) || 0) : 0;
    if (Date.now() - last < 60_000) {
      setLoading(false);
      toast.error("Visita já registrada há poucos instantes.");
      return;
    }

    try {
      await createVisitante({
        nome: parsed.data.nome,
        telefone: parsed.data.telefone,
        morador_siqueira_campos: parsed.data.morador === "sim",
        cidade: parsed.data.morador === "nao" ? parsed.data.cidade : null,
        estado: parsed.data.morador === "nao" ? parsed.data.estado : null,
      });
    } catch {
      setLoading(false);
      toast.error("Não foi possível registrar. Tente novamente.");
      return;
    }

    setLoading(false);
    if (typeof window !== "undefined") localStorage.setItem(recentKey, String(Date.now()));
    setDone(true);
  }

  if (done) {
    return (
      <div
        className="museum-visit-bg min-h-screen flex items-center justify-center px-4"
        style={{ "--museum-visit-bg": `url(${museumVisitBg})` } as React.CSSProperties}
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full text-center bg-card/92 backdrop-blur-md border border-gold/25 rounded-2xl p-10 shadow-2xl"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-9 h-9 text-primary" />
          </div>
          <h1 className="font-display text-3xl text-primary mb-3">Obrigado!</h1>
          <p className="text-muted-foreground leading-relaxed">
            Obrigado por visitar a <strong className="text-foreground">Casa da Cultura
            de Siqueira Campos/PR</strong>. Seu registro foi realizado com sucesso.
          </p>
          <Button
            className="mt-8 w-full"
            variant="outline"
            onClick={() => {
              setNome(""); setTelefone(""); setMorador(""); setCidade(""); setEstado("");
              setDone(false);
            }}
          >
            Registrar novo visitante
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="museum-visit-bg min-h-screen"
      style={{ "--museum-visit-bg": `url(${museumVisitBg})` } as React.CSSProperties}
    >
      <header className="border-b border-gold/25 bg-primary/55 text-primary-foreground backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-5 py-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold/90">Secretaria de Cultura</p>
            <h1 className="font-display text-xl sm:text-2xl mt-1">Casa da Cultura</h1>
            <p className="text-xs text-primary-foreground/70">Siqueira Campos / PR</p>
          </div>
          <Link to="/auth" className="text-xs flex items-center gap-1.5 opacity-80 hover:opacity-100">
            <LogIn className="w-3.5 h-3.5" /> Admin
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-xs uppercase tracking-[0.28em] text-gold/90">
            Norte Pioneiro - Paraná
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-primary-foreground leading-tight mt-3 drop-shadow">
            Seja muito bem-vindo(a).
          </h2>
          <p className="text-primary-foreground/78 mt-2">
            Registre sua visita em poucos segundos.
          </p>
        </motion.div>

        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 bg-card/93 backdrop-blur-md border border-gold/25 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="nome" className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Nome completo
            </Label>
            <Input
              id="nome" value={nome} onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome" required maxLength={120} autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" /> Telefone
            </Label>
            <Input
              id="telefone" inputMode="tel" value={telefone}
              onChange={(e) => setTelefone(formatPhone(e.target.value))}
              placeholder="(00) 00000-0000" required autoComplete="tel"
            />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Você mora em Siqueira Campos/PR?
            </Label>
            <RadioGroup
              value={morador}
              onValueChange={(v) => setMorador(v as "sim" | "nao")}
              className="grid grid-cols-2 gap-3"
            >
              {(["sim", "nao"] as const).map((opt) => (
                <Label
                  key={opt}
                  htmlFor={`m-${opt}`}
                  className={`flex items-center justify-center gap-2 border rounded-lg p-3 cursor-pointer transition-all ${
                    morador === opt
                      ? "border-primary bg-primary/5 text-primary font-semibold"
                      : "hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem id={`m-${opt}`} value={opt} className="sr-only" />
                  {opt === "sim" ? "Sim" : "Não"}
                </Label>
              ))}
            </RadioGroup>
          </div>

          <AnimatePresence>
            {morador === "nao" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid sm:grid-cols-[1fr,120px] gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="cidade" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" /> Cidade
                    </Label>
                    <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} maxLength={80} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select value={estado} onValueChange={setEstado}>
                      <SelectTrigger id="estado"><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map((uf) => (<SelectItem key={uf} value={uf}>{uf}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button type="submit" size="lg" className="w-full text-base h-12" disabled={loading}>
            {loading ? "Registrando..." : "Registrar Visita"}
          </Button>
        </motion.form>

        <p className="text-center text-xs text-primary-foreground/65 mt-6">
          © {new Date().getFullYear()} Casa da Cultura de Siqueira Campos / PR
        </p>
      </main>
    </div>
  );
}
