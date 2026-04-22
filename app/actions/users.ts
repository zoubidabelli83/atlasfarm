"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type ProfileRow = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "agronomist" | "farmer";
  language: "en" | "fr" | "ar";
  status: "active" | "inactive";
  last_login: string | null;
  created_at: string;
};

// ─── Guard: only admin can call these actions ────────────────
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // First try the profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

    

  const roleRaw = profile?.role ?? user.user_metadata?.role;
  const role =
    typeof roleRaw === "string" ? roleRaw.trim().toLowerCase() : "";

  // Accept "admin" from either the profiles table or the auth user_metadata
  if (role !== "admin") throw new Error("Admin access required");

  return { adminId: user.id };
}

// ─── List all users ──────────────────────────────────────────
export async function listUsers(): Promise<ProfileRow[]> {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("profiles")
    .select("id,name,email,role,language,status,last_login,created_at")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProfileRow[];
}

// ─── Create user (admin creates via Supabase Auth + profile) ─
export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: string;
  language: string;
  status: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { adminId } = await requireAdmin();
    const adminClient = createAdminClient();

    // Use the service-role client pattern: create user via admin API
    // Supabase anon key cannot call admin.createUser — we use signUp instead
    // and pass metadata so the trigger populates the profile correctly.
    const { data, error } = await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,  // skip email confirmation — admin sets password
      user_metadata: {
        name: input.name,
        role: input.role,
        language: input.language,
        status: input.status,
      },
    });

    if (error) return { success: false, error: error.message };

    // Upsert profile via SECURITY DEFINER function to bypass RLS
    const { error: profileError } = await adminClient.rpc("admin_create_profile", {
      p_id: data.user.id,
      p_name: input.name,
      p_email: input.email,
      p_role: input.role,
      p_language: input.language,
      p_status: input.status,
    });

    if (profileError) return { success: false, error: profileError.message };

    // Audit log
    await adminClient.from("audit_logs").insert({
      user_id: adminId,
      action: `User created: ${input.email} (${input.role})`,
      entity: "profiles",
      entity_id: data.user.id,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Admin access required",
    };
  }
}

// ─── Update user profile ─────────────────────────────────────
export async function updateUser(
  userId: string,
  input: {
    name: string;
    role: string;
    language: string;
    status: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { adminId } = await requireAdmin();
    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from("profiles")
      .update({
        name: input.name,
        role: input.role,
        language: input.language,
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) return { success: false, error: error.message };

    // Audit log
    await adminClient.from("audit_logs").insert({
      user_id: adminId,
      action: `User updated: role=${input.role}, status=${input.status}`,
      entity: "profiles",
      entity_id: userId,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Admin access required",
    };
  }
}

// ─── Delete user ─────────────────────────────────────────────
export async function deleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { adminId } = await requireAdmin();
    const adminClient = createAdminClient();

    // Delete from auth (cascades to profiles via FK)
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) return { success: false, error: error.message };

    // Audit log
    await adminClient.from("audit_logs").insert({
      user_id: adminId,
      action: `User deleted: ${userId}`,
      entity: "profiles",
      entity_id: userId,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Admin access required",
    };
  }
}

// ─── Reset user password ─────────────────────────────────────
export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { adminId } = await requireAdmin();
    const adminClient = createAdminClient();

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) return { success: false, error: error.message };

    await adminClient.from("audit_logs").insert({
      user_id: adminId,
      action: `Password reset for user: ${userId}`,
      entity: "profiles",
      entity_id: userId,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Admin access required",
    };
  }
}

// ─── Get current user profile ─────────────────────────────────
// If no profile row exists (e.g. admin created directly in Supabase),
// we auto-upsert one from auth metadata so the app works immediately.
export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id,name,email,role,language,status,last_login,created_at")
    .eq("id", user.id)
    .single();

  if (existing) return existing as ProfileRow;

  // No profile row — build one from auth metadata and upsert it.
  // This handles admins created directly in the Supabase dashboard.
  const meta = user.user_metadata ?? {};
  const fallbackName =
    meta.name ??
    meta.full_name ??
    (user.email ? user.email.split("@")[0] : "User");
  const fallbackRole = (meta.role as ProfileRow["role"]) ?? "admin";
  const fallbackLang = (meta.language as ProfileRow["language"]) ?? "fr";

  const newProfile: Omit<ProfileRow, "last_login" | "created_at"> & {
    updated_at: string;
  } = {
    id: user.id,
    name: fallbackName,
    email: user.email ?? "",
    role: fallbackRole,
    language: fallbackLang,
    status: "active",
    updated_at: new Date().toISOString(),
  };

  // Use service-level upsert — no RLS restriction for own row insert
  const { data: upserted, error } = await supabase
    .from("profiles")
    .upsert(newProfile, { onConflict: "id" })
    .select("id,name,email,role,language,status,last_login,created_at")
    .single();

  if (error) {
    // Even if upsert fails (e.g. RLS), return a synthetic profile so the UI works
    return {
      id: user.id,
      name: fallbackName,
      email: user.email ?? "",
      role: fallbackRole,
      language: fallbackLang,
      status: "active",
      last_login: null,
      created_at: new Date().toISOString(),
    };
  }

  return upserted as ProfileRow;
}

// ─── Sign out ────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
}
