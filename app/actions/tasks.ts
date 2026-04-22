"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type TaskRecord = {
  id: string;
  name: string;
  category: string;
  assignedTo: string;
  assignedToId: string | null;
  plotId: string | null;
  plotName: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "inProgress" | "completed";
  description: string;
  isRecommendation: boolean;
};

type DbTask = {
  id: string;
  name: string;
  category: string;
  assigned_to: string | null;
  plot_id: string | null;
  due_date: string | null;
  priority: "high" | "medium" | "low";
  status: "pending" | "inProgress" | "completed";
  description: string | null;
  is_recommendation: boolean | null;
  profiles: { name: string } | null;
  plots: { name: string } | null;
};

function isUuid(value: string | null | undefined): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function mapDbTask(row: DbTask): TaskRecord {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    assignedTo: row.profiles?.name ?? "",
    assignedToId: row.assigned_to,
    plotId: row.plot_id,
    plotName: row.plots?.name ?? "",
    dueDate: row.due_date ?? "",
    priority: row.priority,
    status: row.status,
    description: row.description ?? "",
    isRecommendation: Boolean(row.is_recommendation),
  };
}

async function requireTaskWriteAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error("Profile not found");
  }

  const role = String(profile.role ?? "")
    .trim()
    .toLowerCase();

  if (!["admin", "manager", "agronomist"].includes(role)) {
    throw new Error("Not allowed to modify tasks");
  }

  return { supabase, userId: user.id };
}

export async function listTasks(): Promise<TaskRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      id,
      name,
      category,
      assigned_to,
      plot_id,
      due_date,
      priority,
      status,
      description,
      is_recommendation,
      profiles:assigned_to ( name ),
      plots:plot_id ( name )
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as DbTask[]).map(mapDbTask);
}

export async function createTask(input: {
  name: string;
  category: string;
  assignedToName?: string;
  plotId: string | null;
  dueDate: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "inProgress" | "completed";
  description: string;
  isRecommendation?: boolean;
}): Promise<{ success: boolean; error?: string; task?: TaskRecord }> {
  try {
    const { supabase, userId } = await requireTaskWriteAccess();

    let assignedToId: string | null = null;
    if (input.assignedToName?.trim()) {
      const { data: assignee } = await supabase
        .from("profiles")
        .select("id")
        .ilike("name", input.assignedToName.trim())
        .limit(1)
        .maybeSingle();
      assignedToId = assignee?.id ?? null;
    }

    const safePlotId = isUuid(input.plotId) ? input.plotId : null;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        name: input.name,
        category: input.category,
        assigned_to: assignedToId,
        plot_id: safePlotId,
        due_date: input.dueDate || null,
        priority: input.priority,
        status: input.status,
        description: input.description ?? "",
        is_recommendation: Boolean(input.isRecommendation),
        created_by: userId,
      })
      .select(
        `
        id,
        name,
        category,
        assigned_to,
        plot_id,
        due_date,
        priority,
        status,
        description,
        is_recommendation,
        profiles:assigned_to ( name ),
        plots:plot_id ( name )
      `
      )
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/");
    return { success: true, task: mapDbTask(data as unknown as DbTask) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to create task",
    };
  }
}

export async function updateTask(
  id: string,
  input: {
    name: string;
    category: string;
    assignedToName?: string;
    plotId: string | null;
    dueDate: string;
    priority: "high" | "medium" | "low";
    status: "pending" | "inProgress" | "completed";
    description: string;
    isRecommendation?: boolean;
  }
): Promise<{ success: boolean; error?: string; task?: TaskRecord }> {
  try {
    const { supabase } = await requireTaskWriteAccess();

    let assignedToId: string | null = null;
    if (input.assignedToName?.trim()) {
      const { data: assignee } = await supabase
        .from("profiles")
        .select("id")
        .ilike("name", input.assignedToName.trim())
        .limit(1)
        .maybeSingle();
      assignedToId = assignee?.id ?? null;
    }

    const safePlotId = isUuid(input.plotId) ? input.plotId : null;

    const { data, error } = await supabase
      .from("tasks")
      .update({
        name: input.name,
        category: input.category,
        assigned_to: assignedToId,
        plot_id: safePlotId,
        due_date: input.dueDate || null,
        priority: input.priority,
        status: input.status,
        description: input.description ?? "",
        is_recommendation: Boolean(input.isRecommendation),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        id,
        name,
        category,
        assigned_to,
        plot_id,
        due_date,
        priority,
        status,
        description,
        is_recommendation,
        profiles:assigned_to ( name ),
        plots:plot_id ( name )
      `
      )
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/");
    return { success: true, task: mapDbTask(data as unknown as DbTask) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to update task",
    };
  }
}

export async function deleteTask(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await requireTaskWriteAccess();

    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to delete task",
    };
  }
}

export async function updateTaskStatus(
  id: string,
  status: "pending" | "inProgress" | "completed"
): Promise<{ success: boolean; error?: string; task?: TaskRecord }> {
  try {
    const { supabase } = await requireTaskWriteAccess();

    const { data, error } = await supabase
      .from("tasks")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        id,
        name,
        category,
        assigned_to,
        plot_id,
        due_date,
        priority,
        status,
        description,
        is_recommendation,
        profiles:assigned_to ( name ),
        plots:plot_id ( name )
      `
      )
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/");
    return { success: true, task: mapDbTask(data as unknown as DbTask) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to update task status",
    };
  }
}
