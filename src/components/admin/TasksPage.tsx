"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminSectionHeading } from "@/components/admin/AdminSectionHeading";
import {
  adminCompactButtonActiveClassName,
  adminCompactButtonClassName,
  adminErrorClassName,
  adminInputClassName,
  adminItemTitleClassName,
  adminLabelClassName,
  adminLinkClassName,
  adminListClassName,
  adminMutedTextClassName,
  adminPrimaryButtonClassName,
  adminSecondaryButtonClassName,
} from "@/components/admin/formStyles";
import { invitation } from "@/content/invitation";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import {
  OTHER_TASK_CATEGORY,
  TASK_CATEGORIES,
  groupTasks,
  isPresetTaskCategory,
  isTaskDone,
  isTaskOverdue,
  mapPlanningTaskRow,
  starterChecklist,
  taskDueCopy,
  taskOwnerLabel,
  tasksOverview,
  type TaskCategoryFilter,
  type TaskStatusFilter,
} from "@/lib/tasks";
import { formatDisplayDate, localDateString } from "@/lib/vendors";
import type { PlanningTask, PlanningTaskRow, TaskOwner } from "@/types";

type FormMode = "create" | "edit";

const STATUS_FILTERS: { value: TaskStatusFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "done", label: "Done" },
  { value: "all", label: "All" },
];

export function TasksPage() {
  const configured = hasSupabaseEnv();
  const [tasks, setTasks] = useState<PlanningTask[]>([]);
  const [loading, setLoading] = useState(configured);
  const [loadFailed, setLoadFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("open");
  const [categoryFilter, setCategoryFilter] =
    useState<TaskCategoryFilter>("all");
  const [mode, setMode] = useState<FormMode>("create");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const today = localDateString();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<string>(TASK_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [owner, setOwner] = useState<TaskOwner>("shared");
  const [dueOn, setDueOn] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!configured) return;

    const supabase = createClient();
    let cancelled = false;

    void supabase
      .from("planning_tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          const missingTable =
            error.code === "42P01" ||
            error.code === "PGRST205" ||
            /planning_tasks|schema cache/i.test(error.message);
          setErrorMessage(
            missingTable
              ? "The tasks table is not in Supabase yet. Run supabase/migrations/006_planning_tasks.sql in the SQL editor, then refresh."
              : "Unable to load tasks. Sign in and try again.",
          );
          setTasks([]);
          setLoadFailed(true);
          setLoading(false);
          return;
        }

        setTasks(((data ?? []) as PlanningTaskRow[]).map(mapPlanningTaskRow));
        setErrorMessage("");
        setLoadFailed(false);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [configured, reloadToken]);

  const usedCategories = useMemo(() => {
    return [...new Set(tasks.map((task) => task.category))].sort(
      (left, right) => left.localeCompare(right),
    );
  }, [tasks]);

  const activeCategoryFilter =
    categoryFilter === "all" ||
    tasks.some((task) => task.category === categoryFilter)
      ? categoryFilter
      : "all";

  const filteredTasks = useMemo(() => {
    if (activeCategoryFilter === "all") return tasks;
    return tasks.filter((task) => task.category === activeCategoryFilter);
  }, [activeCategoryFilter, tasks]);

  const groups = useMemo(
    () => groupTasks(filteredTasks, today, statusFilter),
    [filteredTasks, statusFilter, today],
  );

  const overview = useMemo(() => tasksOverview(tasks, today), [tasks, today]);

  function reload() {
    setReloadToken((value) => value + 1);
  }

  function resolvedCategory() {
    if (category === OTHER_TASK_CATEGORY) return customCategory.trim();
    return category.trim();
  }

  function resetForm() {
    setTitle("");
    setNotes("");
    setCategory(TASK_CATEGORIES[0]);
    setCustomCategory("");
    setOwner("shared");
    setDueOn("");
    setCompleted(false);
    setMode("create");
    setEditingId(null);
    setFormOpen(false);
  }

  function openCreate() {
    setErrorMessage("");
    setTitle("");
    setNotes("");
    setCategory(TASK_CATEGORIES[0]);
    setCustomCategory("");
    setOwner("shared");
    setDueOn("");
    setCompleted(false);
    setMode("create");
    setEditingId(null);
    setFormOpen(true);
  }

  function startEdit(task: PlanningTask) {
    setErrorMessage("");
    if (isPresetTaskCategory(task.category)) {
      setCategory(task.category);
      setCustomCategory("");
    } else {
      setCategory(OTHER_TASK_CATEGORY);
      setCustomCategory(task.category);
    }
    setTitle(task.title);
    setNotes(task.notes ?? "");
    setOwner(task.owner);
    setDueOn(task.dueOn ?? "");
    setCompleted(isTaskDone(task));
    setMode("edit");
    setEditingId(task.id);
    setFormOpen(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;

    const nextTitle = title.trim();
    if (!nextTitle) {
      setErrorMessage("Please enter a task title.");
      return;
    }
    const nextCategory = resolvedCategory();
    if (!nextCategory) {
      setErrorMessage("Please choose a category.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const supabase = createClient();
      const existingCompletedAt = editingId
        ? (tasks.find((task) => task.id === editingId)?.completedAt ?? null)
        : null;
      const payload = {
        title: nextTitle,
        notes: notes.trim() || null,
        category: nextCategory,
        owner,
        due_on: dueOn.trim() || null,
        completed_at: completed
          ? (existingCompletedAt ?? new Date().toISOString())
          : null,
      };

      if (mode === "edit" && editingId) {
        const { error } = await supabase
          .from("planning_tasks")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("planning_tasks").insert(payload);
        if (error) throw error;
      }

      resetForm();
      reload();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save this task.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onToggleDone(task: PlanningTask) {
    setTogglingId(task.id);
    setErrorMessage("");
    const supabase = createClient();
    const { error } = await supabase
      .from("planning_tasks")
      .update({
        completed_at: isTaskDone(task) ? null : new Date().toISOString(),
      })
      .eq("id", task.id);
    setTogglingId(null);
    if (error) {
      setErrorMessage("Unable to update this task.");
      return;
    }
    if (editingId === task.id) resetForm();
    reload();
  }

  async function onDelete(task: PlanningTask) {
    if (!window.confirm(`Delete “${task.title}”?`)) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("planning_tasks")
      .delete()
      .eq("id", task.id);
    if (error) {
      setErrorMessage("Unable to delete this task.");
      return;
    }
    if (editingId === task.id) resetForm();
    reload();
  }

  async function onSeedStarter() {
    if (tasks.length > 0) return;
    setSeeding(true);
    setErrorMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.from("planning_tasks").insert(
        starterChecklist().map((task) => ({
          title: task.title,
          notes: task.notes,
          category: task.category,
          owner: task.owner,
          due_on: task.dueOn,
        })),
      );
      if (error) throw error;
      reload();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to add the starter checklist.",
      );
    } finally {
      setSeeding(false);
    }
  }

  const nextCopy = overview.next
    ? `${overview.next.title}${
        overview.next.dueOn
          ? ` · ${formatDisplayDate(overview.next.dueOn)}`
          : ""
      }`
    : "Nothing waiting";

  const visibleCount = groups.reduce(
    (sum, group) => sum + group.tasks.length,
    0,
  );

  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-3xl px-6 py-16">
        <AdminSectionHeading
          heading="h1"
          eyebrow="Tasks"
          title="Wedding checklist"
          description="Track what still needs doing before the day. Tick items off as you go, assign them to either of you, and keep due dates close to the wedding timeline."
        />

        {!configured ? (
          <p className={`mt-8 ${adminMutedTextClassName}`}>
            Connect Supabase to manage tasks.
          </p>
        ) : (
          <>
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={openCreate}
                disabled={loadFailed}
                className={adminPrimaryButtonClassName}
              >
                Add task
              </button>
              {!loading && !loadFailed && tasks.length === 0 ? (
                <button
                  type="button"
                  disabled={seeding}
                  onClick={() => void onSeedStarter()}
                  className={adminSecondaryButtonClassName}
                >
                  {seeding ? "Adding…" : "Add starter checklist"}
                </button>
              ) : null}
            </div>

            {errorMessage && !formOpen ? (
              <p className={`mt-6 ${adminErrorClassName}`} role="alert">
                {errorMessage}
              </p>
            ) : null}

            {loading || tasks.length === 0 ? null : (
              <div className="mt-10 border border-border bg-surface px-5 py-4">
                <div className={`space-y-1 ${adminMutedTextClassName}`}>
                  <p>
                    {overview.openCount} open
                    {" · "}
                    {overview.doneCount} done
                  </p>
                  <p>
                    {overview.overdueCount > 0
                      ? `${overview.overdueCount} overdue`
                      : "Nothing overdue"}
                    {" · "}
                    Next: {nextCopy}
                  </p>
                </div>
              </div>
            )}

            {loadFailed ? null : (
              <div className="mt-8 flex flex-wrap items-end gap-6">
                <div>
                  <p className={adminLabelClassName}>Status</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {STATUS_FILTERS.map((option) => {
                      const selected = statusFilter === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setStatusFilter(option.value)}
                          className={
                            selected
                              ? adminCompactButtonActiveClassName
                              : adminCompactButtonClassName
                          }
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="block min-w-[10rem] max-w-xs flex-1">
                  <span className={adminLabelClassName}>Category</span>
                  <select
                    value={activeCategoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    className={adminInputClassName}
                  >
                    <option value="all">All categories</option>
                    {usedCategories.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div className="mt-12 space-y-10">
              {loading ? (
                <p className={adminMutedTextClassName}>Loading tasks…</p>
              ) : loadFailed ? null : tasks.length === 0 ? (
                <p className={adminMutedTextClassName}>
                  No tasks yet. Add one, or start from a typical wedding
                  checklist timed to {invitation.weddingDateLabel}.
                </p>
              ) : visibleCount === 0 ? (
                <p className={adminMutedTextClassName}>
                  {statusFilter === "open" && activeCategoryFilter === "all"
                    ? "No open tasks. You are all caught up."
                    : "No tasks match these filters."}
                </p>
              ) : (
                groups.map((group) => (
                  <section key={group.id}>
                    <p
                      className={`${adminLabelClassName} ${
                        group.id === "overdue" ? "text-red-800" : ""
                      }`}
                    >
                      {group.title}
                    </p>
                    <div className={`mt-3 ${adminListClassName}`}>
                      {group.tasks.map((task) => {
                        const done = isTaskDone(task);
                        const overdue = isTaskOverdue(task, today);
                        const dueCopy = taskDueCopy(task, today);
                        return (
                          <article
                            key={task.id}
                            className="flex items-start gap-4 py-5"
                          >
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={done}
                              aria-label={
                                done
                                  ? `Mark ${task.title} as open`
                                  : `Mark ${task.title} as done`
                              }
                              disabled={togglingId === task.id}
                              onClick={() => void onToggleDone(task)}
                              className={`mt-1 flex size-5 shrink-0 items-center justify-center border transition disabled:opacity-60 ${
                                done
                                  ? "border-navy bg-navy text-background"
                                  : overdue
                                    ? "border-red-800"
                                    : "border-border bg-surface"
                              }`}
                            >
                              {done ? (
                                <svg
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  aria-hidden="true"
                                  className="size-3"
                                >
                                  <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                                </svg>
                              ) : null}
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <h2
                                    className={`${adminItemTitleClassName} text-xl ${
                                      done
                                        ? "text-muted line-through decoration-border"
                                        : ""
                                    }`}
                                  >
                                    {task.title}
                                  </h2>
                                  <p
                                    className={`mt-1 ${
                                      overdue
                                        ? "text-sm text-red-800"
                                        : adminMutedTextClassName
                                    }`}
                                  >
                                    {task.category}
                                    {" · "}
                                    {taskOwnerLabel(task.owner)}
                                    {dueCopy ? ` · ${dueCopy}` : ""}
                                  </p>
                                  {task.notes ? (
                                    <p
                                      className={`mt-3 max-w-xl ${adminMutedTextClassName}`}
                                    >
                                      {task.notes}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="flex flex-wrap gap-3 text-sm">
                                  <button
                                    type="button"
                                    onClick={() => startEdit(task)}
                                    className={adminLinkClassName}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void onDelete(task)}
                                    className={adminLinkClassName}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </div>

            <AdminModal
              open={formOpen}
              title={mode === "edit" ? "Edit task" : "Add task"}
              onClose={resetForm}
            >
              <form onSubmit={onSubmit} className="space-y-6">
                <label className="block">
                  <span className={adminLabelClassName}>Title</span>
                  <input
                    required
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Book the florist"
                    className={adminInputClassName}
                  />
                </label>

                <label className="block">
                  <span className={adminLabelClassName}>Category</span>
                  <select
                    required
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className={adminInputClassName}
                  >
                    {TASK_CATEGORIES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                    <option value={OTHER_TASK_CATEGORY}>
                      {OTHER_TASK_CATEGORY}
                    </option>
                  </select>
                </label>

                {category === OTHER_TASK_CATEGORY ? (
                  <label className="block">
                    <span className={adminLabelClassName}>Custom category</span>
                    <input
                      required
                      value={customCategory}
                      onChange={(event) =>
                        setCustomCategory(event.target.value)
                      }
                      placeholder="Honeymoon"
                      className={adminInputClassName}
                    />
                  </label>
                ) : null}

                <label className="block">
                  <span className={adminLabelClassName}>Owner</span>
                  <select
                    value={owner}
                    onChange={(event) =>
                      setOwner(event.target.value as TaskOwner)
                    }
                    className={adminInputClassName}
                  >
                    <option value="shared">Both</option>
                    <option value="partner_one">
                      {invitation.couple.partnerOne}
                    </option>
                    <option value="partner_two">
                      {invitation.couple.partnerTwo}
                    </option>
                  </select>
                </label>

                <label className="block">
                  <span className={adminLabelClassName}>Due date</span>
                  <input
                    type="date"
                    value={dueOn}
                    onChange={(event) => setDueOn(event.target.value)}
                    className={adminInputClassName}
                  />
                </label>

                <label className="block">
                  <span className={adminLabelClassName}>Notes</span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    placeholder="Anything to remember."
                    className={adminInputClassName}
                  />
                </label>

                {mode === "edit" ? (
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={completed}
                      onChange={(event) => setCompleted(event.target.checked)}
                      className="size-4 border-border accent-navy"
                    />
                    <span className="text-sm text-foreground">Done</span>
                  </label>
                ) : null}

                {errorMessage ? (
                  <p className={adminErrorClassName} role="alert">
                    {errorMessage}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className={adminPrimaryButtonClassName}
                  >
                    {saving
                      ? "Saving…"
                      : mode === "edit"
                        ? "Save task"
                        : "Add task"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className={adminSecondaryButtonClassName}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </AdminModal>
          </>
        )}
      </section>
    </main>
  );
}
