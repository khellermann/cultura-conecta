import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, User as UserIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createAdminAccount,
  getFirebaseAuth,
  getCurrentUserProfile,
  isFirebaseConfigured,
  logout,
  sendPasswordReset,
  signInAdmin,
} from "@/integrations/firebase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Acesso administrativo - Casa da Cultura" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    getCurrentUserProfile().then((profile) => {
      if (profile?.approved) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signInAdmin(email, password);
      const profile = await getCurrentUserProfile();
      if (!profile?.approved) {
        await logout();
        setLoading(false);
        return toast.info("Seu acesso está aguardando aprovação do administrador.");
      }
    } catch (error) {
      setLoading(false);
      return toast.error((error as Error).message);
    }
    setLoading(false);
    toast.success("Bem-vindo!");
    navigate({ to: "/admin" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Senha deve ter pelo menos 6 caracteres");
    setLoading(true);
    try {
      await createAdminAccount({ email, password, nome });
      const profile = await getCurrentUserProfile();
      if (!profile?.approved) {
        await logout();
        setLoading(false);
        toast.success("Conta criada! Aguarde a aprovação do administrador.");
        setTab("login");
        return;
      }
    } catch (error) {
      setLoading(false);
      return toast.error((error as Error).message);
    }
    setLoading(false);
    toast.success("Conta criada! Você já pode acessar o painel.");
    navigate({ to: "/admin" });
  }

  async function handleReset() {
    if (!email) return toast.error("Informe o e-mail no campo acima.");
    setResetLoading(true);
    try {
      await sendPasswordReset(email);
    } catch (error) {
      setResetLoading(false);
      return toast.error((error as Error).message);
    }
    setResetLoading(false);
    toast.success("Enviamos um link de redefinição para seu e-mail.");
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar ao registro
        </Link>

        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-bordo text-primary-foreground p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-gold/90">Painel</p>
            <h1 className="font-display text-2xl mt-1">Casa da Cultura</h1>
            <p className="text-xs opacity-80">Siqueira Campos / PR</p>
          </div>

          <div className="p-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <Field icon={<Mail className="w-4 h-4" />} label="E-mail" id="email">
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  <Field icon={<Lock className="w-4 h-4" />} label="Senha" id="password">
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </Field>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={resetLoading}
                    className="block w-full text-xs text-muted-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resetLoading ? "Enviando e-mail..." : "Esqueci minha senha"}
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  <Field icon={<UserIcon className="w-4 h-4" />} label="Nome" id="nome">
                    <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
                  </Field>
                  <Field icon={<Mail className="w-4 h-4" />} label="E-mail" id="signup-email">
                    <Input id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  <Field icon={<Lock className="w-4 h-4" />} label="Senha" id="signup-password">
                    <Input id="signup-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </Field>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Criando..." : "Criar conta"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Os e-mails em <strong>VITE_FIREBASE_ADMIN_EMAILS</strong> recebem acesso de administrador.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ icon, label, id, children }: { icon: React.ReactNode; label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2 text-sm">
        <span className="text-primary">{icon}</span>{label}
      </Label>
      {children}
    </div>
  );
}
