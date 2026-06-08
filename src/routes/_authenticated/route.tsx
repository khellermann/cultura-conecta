import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { waitForFirebaseUser } from "@/integrations/firebase/auth";
import { getCurrentUserProfile } from "@/integrations/firebase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = await waitForFirebaseUser();
    if (!user) throw redirect({ to: "/auth" });
    let profile;
    try {
      profile = await getCurrentUserProfile();
    } catch {
      throw redirect({ to: "/auth" });
    }
    if (!profile?.approved) throw redirect({ to: "/auth" });
    return { user, profile };
  },
  component: () => <Outlet />,
});
