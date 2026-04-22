import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/users";
import { I18nProvider } from "@/contexts/i18n-context";
import { AppProvider } from "@/contexts/app-context";
import AppShell from "@/components/layout/AppShell";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profile = await getCurrentProfile();

  // If profile inactive, sign out and redirect
  if (profile?.status === "inactive") {
    await supabase.auth.signOut();
    redirect("/auth/login");
  }

  return (
    <I18nProvider initialLang={profile?.language ?? "fr"}>
      <AppProvider userProfile={profile}>
        <AppShell />
      </AppProvider>
    </I18nProvider>
  );
}
