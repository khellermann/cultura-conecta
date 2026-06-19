import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  completePasswordReset,
  validatePasswordResetCode,
} from "@/integrations/firebase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: typeof search.mode === "string" ? search.mode : "",
    oobCode: typeof search.oobCode === "string" ? search.oobCode : "",
  }),
  head: () => ({ meta: [{ title: "Redefinir senha - Casa da Cultura" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { mode, oobCode } = Route.useSearch();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [validating, setValidating] = useState(true);
  const [invalidLink, setInvalidLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (mode !== "resetPassword" || !oobCode) {
      setInvalidLink(true);
      setValidating(false);
      return;
    }

    validatePasswordResetCode(oobCode)
      .then(setEmail)
      .catch(() => setInvalidLink(true))
      .finally(() => setValidating(false));
  }, [mode, oobCode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Senha deve ter ao menos 6 caracteres.");
    if (password !== confirmPassword) return toast.error("As senhas não são iguais.");

    setLoading(true);
    try {
      await completePasswordReset(oobCode, password);
    } catch {
      setLoading(false);
      setInvalidLink(true);
      return toast.error("O link expirou ou já foi utilizado. Solicite um novo e-mail.");
    }

    setLoading(false);
    setDone(true);
    toast.success("Senha redefinida com sucesso!");
  }

  if (validating) {
    return (
      <PageShell>
        <p className="text-center text-sm text-muted-foreground">Validando seu link...</p>
      </PageShell>
    );
  }

  if (invalidLink) {
    return (
      <PageShell>
        <div className="space-y-4 text-center">
          <LockKeyhole className="mx-auto h-10 w-10 text-primary" />
          <h1 className="font-display text-2xl text-primary">Link inválido ou expirado</h1>
          <p className="text-sm text-muted-foreground">
            Volte à tela de acesso e solicite um novo e-mail de redefinição.
          </p>
          <Button asChild className="w-full">
            <Link to="/auth">Voltar ao acesso</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  if (done) {
    return (
      <PageShell>
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-11 w-11 text-emerald-600" />
          <h1 className="font-display text-2xl text-primary">Senha redefinida</h1>
          <p className="text-sm text-muted-foreground">
            Sua nova senha já está ativa. Agora você pode entrar no painel.
          </p>
          <Button className="w-full" onClick={() => navigate({ to: "/auth" })}>
            Entrar no painel
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Redefinição de senha</p>
          <h1 className="font-display text-2xl text-primary">Crie uma nova senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">{email}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">Nova senha</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirme a nova senha</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </form>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          to="/auth"
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="rounded-lg border bg-card p-7 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
