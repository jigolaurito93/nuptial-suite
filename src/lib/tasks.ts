import { invitation } from "@/content/invitation";
import { formatDisplayDate, localDateString } from "@/lib/vendors";
import type { PlanningTask, PlanningTaskRow, TaskOwner } from "@/types";

export const TASK_CATEGORIES = [
  "Planning",
  "Venue",
  "Vendors",
  "Attire",
  "Guests",
  "Legal",
  "Travel",
  "Day-of",
] as const;

export const OTHER_TASK_CATEGORY = "Other";

export const TASK_OWNERS: TaskOwner[] = [
  "shared",
  "partner_one",
  "partner_two",
];

export type TaskStatusFilter = "open" | "done" | "all";
export type TaskCategoryFilter = "all" | string;

export type TaskGroupId = "overdue" | "upcoming" | "undated" | "done";

export type TaskGroup = {
  id: TaskGroupId;
  title: string;
  tasks: PlanningTask[];
};

export type TasksOverview = {
  openCount: number;
  doneCount: number;
  overdueCount: number;
  next: PlanningTask | null;
};

export type StarterTaskDraft = {
  title: string;
  notes: string | null;
  category: string;
  owner: TaskOwner;
  dueOn: string | null;
};

export function isPresetTaskCategory(value: string) {
  return (TASK_CATEGORIES as readonly string[]).includes(value);
}

export function isTaskOwner(value: unknown): value is TaskOwner {
  return typeof value === "string" && TASK_OWNERS.includes(value as TaskOwner);
}

export function mapPlanningTaskRow(row: PlanningTaskRow): PlanningTask {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    category: row.category,
    owner: isTaskOwner(row.owner) ? row.owner : "shared",
    dueOn: row.due_on,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function taskOwnerLabel(owner: TaskOwner) {
  if (owner === "partner_one") return invitation.couple.partnerOne;
  if (owner === "partner_two") return invitation.couple.partnerTwo;
  return "Both";
}

export function weddingDateString(iso = invitation.weddingDate) {
  return iso.slice(0, 10);
}

export function shiftDate(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return localDateString(date);
}

export function shiftMonths(isoDate: string, months: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setMonth(date.getMonth() + months);
  return localDateString(date);
}

export function isTaskDone(task: PlanningTask) {
  return Boolean(task.completedAt);
}

export function isTaskOverdue(task: PlanningTask, today: string) {
  return !isTaskDone(task) && Boolean(task.dueOn && task.dueOn < today);
}

export function compareOpenTasks(
  left: PlanningTask,
  right: PlanningTask,
  today: string,
) {
  const leftOverdue = isTaskOverdue(left, today);
  const rightOverdue = isTaskOverdue(right, today);
  if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;

  const leftDue = left.dueOn ?? "9999-12-31";
  const rightDue = right.dueOn ?? "9999-12-31";
  if (leftDue !== rightDue) return leftDue.localeCompare(rightDue);

  return left.title.localeCompare(right.title);
}

export function compareDoneTasks(left: PlanningTask, right: PlanningTask) {
  const leftDone = left.completedAt ?? "";
  const rightDone = right.completedAt ?? "";
  if (leftDone !== rightDone) return rightDone.localeCompare(leftDone);
  return left.title.localeCompare(right.title);
}

export function tasksOverview(
  tasks: PlanningTask[],
  today: string,
): TasksOverview {
  const open = tasks.filter((task) => !isTaskDone(task));
  const overdue = open.filter((task) => isTaskOverdue(task, today));
  const dated = open
    .filter((task) => task.dueOn)
    .sort((left, right) => (left.dueOn ?? "").localeCompare(right.dueOn ?? ""));

  return {
    openCount: open.length,
    doneCount: tasks.length - open.length,
    overdueCount: overdue.length,
    next: dated[0] ?? open[0] ?? null,
  };
}

export function groupTasks(
  tasks: PlanningTask[],
  today: string,
  statusFilter: TaskStatusFilter,
): TaskGroup[] {
  const overdue: PlanningTask[] = [];
  const upcoming: PlanningTask[] = [];
  const undated: PlanningTask[] = [];
  const done: PlanningTask[] = [];

  for (const task of tasks) {
    if (isTaskDone(task)) {
      done.push(task);
      continue;
    }
    if (isTaskOverdue(task, today)) {
      overdue.push(task);
      continue;
    }
    if (task.dueOn) {
      upcoming.push(task);
      continue;
    }
    undated.push(task);
  }

  overdue.sort((left, right) => compareOpenTasks(left, right, today));
  upcoming.sort((left, right) => compareOpenTasks(left, right, today));
  undated.sort((left, right) => left.title.localeCompare(right.title));
  done.sort(compareDoneTasks);

  const groups: TaskGroup[] = [];
  if (statusFilter !== "done") {
    groups.push({ id: "overdue", title: "Overdue", tasks: overdue });
    groups.push({ id: "upcoming", title: "Upcoming", tasks: upcoming });
    groups.push({ id: "undated", title: "No date", tasks: undated });
  }
  if (statusFilter !== "open") {
    groups.push({ id: "done", title: "Done", tasks: done });
  }
  return groups.filter((group) => group.tasks.length > 0);
}

export function taskDueCopy(task: PlanningTask, today: string) {
  if (!task.dueOn) return null;
  const due = formatDisplayDate(task.dueOn);
  if (isTaskOverdue(task, today)) {
    return due ? `Overdue · due ${due}` : "Overdue";
  }
  return due ? `Due ${due}` : null;
}

export function starterChecklist(
  weddingDate = weddingDateString(),
): StarterTaskDraft[] {
  return [
    {
      title: "Set the overall budget",
      category: "Planning",
      owner: "shared",
      notes: "Agree on a ceiling before booking vendors.",
      dueOn: shiftMonths(weddingDate, -18),
    },
    {
      title: "Book ceremony and reception venues",
      category: "Venue",
      owner: "shared",
      notes: "Hold the chapel and Antonio's dates with deposits.",
      dueOn: shiftMonths(weddingDate, -16),
    },
    {
      title: "Book a coordinator",
      category: "Vendors",
      owner: "shared",
      notes: null,
      dueOn: shiftMonths(weddingDate, -15),
    },
    {
      title: "Book photographer and videographer",
      category: "Vendors",
      owner: "shared",
      notes: null,
      dueOn: shiftMonths(weddingDate, -14),
    },
    {
      title: "Draft the guest list",
      category: "Guests",
      owner: "shared",
      notes: "Start from households you already know you will invite.",
      dueOn: shiftMonths(weddingDate, -12),
    },
    {
      title: "Book HMUA",
      category: "Vendors",
      owner: "partner_two",
      notes: "Include trials for the bride and entourage.",
      dueOn: shiftMonths(weddingDate, -12),
    },
    {
      title: "Order gown and barong",
      category: "Attire",
      owner: "shared",
      notes: "Leave time for fittings and alterations.",
      dueOn: shiftMonths(weddingDate, -10),
    },
    {
      title: "Book florist, host, cake, and entertainment",
      category: "Vendors",
      owner: "shared",
      notes: null,
      dueOn: shiftMonths(weddingDate, -9),
    },
    {
      title: "Send save-the-dates",
      category: "Guests",
      owner: "shared",
      notes: "Especially for guests traveling to Batangas and Tagaytay.",
      dueOn: shiftMonths(weddingDate, -8),
    },
    {
      title: "Hold a hotel room block",
      category: "Travel",
      owner: "shared",
      notes: "Share the invitation hotel list once rooms are held.",
      dueOn: shiftMonths(weddingDate, -6),
    },
    {
      title: "Send invitations",
      category: "Guests",
      owner: "shared",
      notes: "Personal invite links are already on each household card.",
      dueOn: shiftMonths(weddingDate, -4),
    },
    {
      title: "Apply for CENOMAR and marriage license",
      category: "Legal",
      owner: "shared",
      notes: "A Philippine marriage license is typically valid for 120 days.",
      dueOn: shiftMonths(weddingDate, -3),
    },
    {
      title: "Follow up pending RSVPs",
      category: "Guests",
      owner: "shared",
      notes: `Public RSVP closes ${invitation.rsvpByLabel}.`,
      dueOn: shiftDate(weddingDate, -31),
    },
    {
      title: "Finalize the seating chart",
      category: "Guests",
      owner: "shared",
      notes: null,
      dueOn: shiftDate(weddingDate, -21),
    },
    {
      title: "Confirm final headcount with the caterer",
      category: "Vendors",
      owner: "shared",
      notes: null,
      dueOn: shiftDate(weddingDate, -14),
    },
    {
      title: "Prepare the day-of timeline and emergency kit",
      category: "Day-of",
      owner: "shared",
      notes: "Vows, payments, vendor contacts, sewing kit, and snacks.",
      dueOn: shiftDate(weddingDate, -7),
    },
    {
      title: "Confirm getting-ready schedule and transport",
      category: "Day-of",
      owner: "shared",
      notes: null,
      dueOn: shiftDate(weddingDate, -3),
    },
  ];
}
