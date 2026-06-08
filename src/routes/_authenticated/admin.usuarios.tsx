import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  approveUserProfile,
  fetchUserProfiles,
  getCurrentUserProfile,
  removeUserProfile,
  type UserProfile,
} from "@/integrations/firebase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  component: UsuariosPage,
});

function UsuariosPage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getCurrentUserProfile,
  });
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUserProfiles,
    enabled: profile?.isAdmin === true,
    retry: false,
  });

  const pending = users.filter((user) => !user.approved).length;

  if (profileLoading) {
    return <p className="text-sm text-muted-foreground">Carregando permissões...</p>;
  }

  if (!profile?.isAdmin) {
    return (
      <div className="space-y-2 max-w-2xl">
        <h1 className="font-display text-3xl text-primary">Acesso restrito</h1>
        <p className="text-muted-foreground text-sm">
          Somente o administrador khellermann@gmail.com pode aprovar ou remover usuários.
        </p>
      </div>
    );
  }

  async function approve(user: UserProfile) {
    try {
      await approveUserProfile(user.id);
      toast.success(`${user.nome} aprovado`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function remove(user: UserProfile) {
    if (user.role === "admin") {
      toast.error("O administrador principal não pode ser removido pelo painel.");
      return;
    }

    try {
      await removeUserProfile(user.id);
      toast.success(`${user.nome} removido`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl text-primary">Usuários</h1>
        <p className="text-muted-foreground text-sm">
          Aprove novos acessos ao painel. Pendentes: {pending}
        </p>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">E-mail</th>
                <th className="text-left px-4 py-3">Perfil</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Carregando usuários...
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-destructive">
                    Não foi possível carregar usuários. Confira as regras do Firestore.
                  </td>
                </tr>
              )}
              {!isLoading && !error && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{user.nome}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.role === "admin" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-gold text-gold-foreground font-semibold">
                        <ShieldCheck className="w-3 h-3" /> Administrador
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        <UserCog className="w-3 h-3" /> Operador
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.approved ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Aprovado
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      {!user.approved && (
                        <Button size="sm" variant="outline" onClick={() => approve(user)}>
                          <Check className="w-4 h-4 mr-1.5" /> Aprovar
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remove(user)}
                        aria-label="Remover usuário"
                        disabled={user.role === "admin"}
                      >
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

      <p className="text-xs text-muted-foreground">
        A remoção acima bloqueia o acesso ao painel removendo o perfil do usuário. Para apagar a conta do Firebase
        Authentication definitivamente, use o Firebase Console ou uma função backend com Admin SDK.
      </p>
    </div>
  );
}
