import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, FileBarChart, QrCode, LogOut, Menu, X, UserCog } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUserProfile, logout } from "@/integrations/firebase/client";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/visitantes", label: "Visitantes", icon: Users },
  { to: "/admin/relatorios", label: "Relatórios", icon: FileBarChart },
  { to: "/admin/qrcode", label: "QR Code", icon: QrCode },
  { to: "/admin/usuarios", label: "Usuários", icon: UserCog, adminOnly: true },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getCurrentUserProfile,
  });

  async function handleLogout() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await logout();
    navigate({ to: "/auth", replace: true });
  }

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-paper flex">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground transform transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-sidebar-border">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Painel</p>
          <h1 className="font-display text-lg mt-1 leading-tight">Casa da Cultura</h1>
          <p className="text-[11px] opacity-70">Siqueira Campos / PR</p>
        </div>

        <nav className="p-3 space-y-1">
          {NAV.filter((item) => !("adminOnly" in item) || profile?.isAdmin).map((item) => {
            const Active = isActive(item.to, "exact" in item ? item.exact : false);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  Active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                    : "hover:bg-sidebar-accent"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <div className="mb-3">
            <p className="text-sm font-medium truncate">{profile?.nome}</p>
            <p className="text-[11px] opacity-70 truncate">{profile?.email}</p>
            {profile?.isAdmin && (
              <span className="inline-block mt-1 text-[10px] uppercase tracking-wider bg-gold text-gold-foreground px-2 py-0.5 rounded-full font-semibold">
                Administrador
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {open && (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b bg-card">
          <button onClick={() => setOpen(true)} aria-label="Abrir menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-display text-primary">Casa da Cultura</span>
          <span className="w-5" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
