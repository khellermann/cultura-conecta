import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCurrentUserPassword } from "@/integrations/firebase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Redefinir senha - Casa da Cultura" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Senha deve ter ao menos 6 caracteres");
    setLoading(true);
    try {
      await updateCurrentUserPassword(password);
    } catch (error) {
      setLoading(false);
      return toast.error((error as Error).message);
    }
    setLoading(false);
    toast.success("Senha redefinida!");
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-card border rounded-2xl p-8 shadow-sm space-y-4">
        <h1 className="font-display text-2xl text-primary">Nova senha</h1>
        <div className="space-y-2">
          <Label htmlFor="np">Senha</Label>
          <Input id="np" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </form>
    </div>
  );
}
