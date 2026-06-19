import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AVALIACOES, createPesquisaSatisfacao, fetchVisitanteById, type AvaliacaoValor } from "@/lib/pesquisas";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import museumVisitBg from "@/assets/hero-museu.jpg";
import { getEspacoLabel, isEspacoVisita } from "@/lib/visitantes";

export const Route = createFileRoute("/pesquisa/$visitanteId")({
  validateSearch: (search: Record<string, unknown>) => ({
    espaco: isEspacoVisita(search.espaco) ? search.espaco : "casa-da-cultura",
  }),
  component: PesquisaPage,
});

function PesquisaPage() {
  const { visitanteId } = Route.useParams();
  const { espaco } = Route.useSearch();
  const { data: visitante } = useQuery({
    queryKey: ["visitante", visitanteId],
    queryFn: () => fetchVisitanteById(visitanteId),
  });
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [avaliacao, setAvaliacao] = useState<AvaliacaoValor | null>(null);
  const [comentarioGostou, setComentarioGostou] = useState("");
  const [sugestaoMelhoria, setSugestaoMelhoria] = useState("");
  const [eventos, setEventos] = useState<"sim" | "nao" | "">("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const selectedOption = useMemo(
    () => AVALIACOES.find((item) => item.value === avaliacao),
    [avaliacao],
  );

  async function submitPesquisa() {
    if (!selectedOption) {
      toast.info("Escolha uma avaliação para continuar.");
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      await createPesquisaSatisfacao({
        visitante_id: visitanteId,
        espaco,
        avaliacao: selectedOption.value,
        emoji: selectedOption.emoji,
        comentario_gostou: comentarioGostou.trim(),
        sugestao_melhoria: sugestaoMelhoria.trim(),
        deseja_receber_eventos: eventos ? eventos === "sim" : null,
      });
      setDone(true);
    } catch (error) {
      toast.error("Não foi possível enviar a pesquisa. Tente novamente.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="museum-visit-bg min-h-screen px-4 py-6 sm:py-10 flex items-center justify-center"
      style={{ "--museum-visit-bg": `url(${museumVisitBg})` } as React.CSSProperties}
    >
      <main className="w-full max-w-xl">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.section
              key="done"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative overflow-hidden bg-card/94 backdrop-blur-md border border-gold/25 rounded-2xl p-7 sm:p-9 text-center shadow-2xl"
            >
              <Confetti />
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <Heart className="w-9 h-9 text-primary fill-primary/20" />
              </div>
              <h1 className="font-display text-3xl text-primary">Obrigado!</h1>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Obrigado pela sua visita e pela sua opinião! O espaço {getEspacoLabel(espaco)} de
                Siqueira Campos/PR espera receber você novamente em breve.
              </p>
              <Button asChild className="mt-8 w-full h-12">
                <Link to="/" search={{ espaco }}>Finalizar</Link>
              </Button>
            </motion.section>
          ) : (
            <motion.section
              key={`step-${step}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="bg-card/94 backdrop-blur-md border border-gold/25 rounded-2xl p-5 sm:p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-primary">Pesquisa rápida</p>
                  <h1 className="font-display text-2xl sm:text-3xl text-primary mt-1">
                    Como foi sua experiência?
                  </h1>
                  {visitante?.nome && (
                    <p className="text-sm text-muted-foreground mt-1">Obrigado pela visita, {visitante.nome}.</p>
                  )}
                </div>
                <Sparkles className="w-8 h-8 text-gold shrink-0" />
              </div>

              <div className="mt-6 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-bordo"
                  initial={false}
                  animate={{ width: `${(step / 3) * 100}%` }}
                />
              </div>

              {step === 1 && (
                <div className="mt-7">
                  <p className="font-medium text-lg">Como foi sua experiência na Casa da Cultura hoje?</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
                    {AVALIACOES.map((option) => {
                      const selected = option.value === avaliacao;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setAvaliacao(option.value)}
                          className={`rounded-xl border p-3 min-h-28 transition-all bg-background/80 ${
                            selected ? "border-primary ring-2 ring-primary/20 shadow-lg" : "hover:border-primary/50"
                          }`}
                        >
                          <motion.span
                            className="block text-5xl"
                            animate={selected ? { scale: [1, 1.15, 1], filter: "drop-shadow(0 0 10px rgba(191,146,69,.65))" } : { scale: 1 }}
                            transition={{ duration: 0.45 }}
                          >
                            {option.emoji}
                          </motion.span>
                          <span className="block text-xs font-semibold mt-2">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <Button className="mt-6 w-full h-12" onClick={() => selectedOption ? setStep(2) : toast.info("Toque em um emoji para continuar.")}>
                    Continuar <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button variant="ghost" className="mt-2 w-full" onClick={() => setDone(true)}>
                    Responder depois
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="mt-7 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="gostou">O que você mais gostou?</Label>
                    <Textarea
                      id="gostou"
                      value={comentarioGostou}
                      onChange={(event) => setComentarioGostou(event.target.value)}
                      placeholder="Conte em poucas palavras"
                      className="min-h-24"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sugestao">Tem alguma sugestão para melhorarmos?</Label>
                    <Textarea
                      id="sugestao"
                      value={sugestaoMelhoria}
                      onChange={(event) => setSugestaoMelhoria(event.target.value)}
                      placeholder="Sua sugestão é bem-vinda"
                      className="min-h-24"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-12" onClick={() => setStep(1)}>Voltar</Button>
                    <Button className="h-12" onClick={() => setStep(3)}>Continuar</Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="mt-7 space-y-6">
                  <div>
                    <p className="font-medium">Você gostaria de receber informações sobre eventos futuros?</p>
                    <RadioGroup value={eventos} onValueChange={(value) => setEventos(value as "sim" | "nao")} className="grid grid-cols-2 gap-3 mt-4">
                      <label className="flex items-center gap-2 rounded-xl border bg-background/80 p-4 cursor-pointer">
                        <RadioGroupItem value="sim" id="eventos-sim" />
                        <span>Sim</span>
                      </label>
                      <label className="flex items-center gap-2 rounded-xl border bg-background/80 p-4 cursor-pointer">
                        <RadioGroupItem value="nao" id="eventos-nao" />
                        <span>Não</span>
                      </label>
                    </RadioGroup>
                    {eventos === "sim" && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Usaremos o telefone informado no cadastro para futuras comunicações sobre eventos.
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-12" onClick={() => setStep(2)}>Voltar</Button>
                    <Button className="h-12" onClick={submitPesquisa} disabled={loading}>
                      {loading ? "Enviando..." : "Enviar opinião"}
                    </Button>
                  </div>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 22 }).map((_, index) => (
        <motion.span
          key={index}
          className="absolute top-0 h-2.5 w-2.5 rounded-full"
          style={{
            left: `${(index * 37) % 100}%`,
            backgroundColor: ["#5f1a1a", "#bf9245", "#2f7d5c", "#7a4f9d"][index % 4],
          }}
          initial={{ y: -20, opacity: 0, rotate: 0 }}
          animate={{ y: 460, opacity: [0, 1, 1, 0], rotate: 260 }}
          transition={{ duration: 2.2 + (index % 5) * 0.15, delay: (index % 7) * 0.08 }}
        />
      ))}
    </div>
  );
}
