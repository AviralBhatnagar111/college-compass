// Persisted task inbox — fed by "Assign" actions across dashboards.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Task {
  id: string;
  title: string;
  assigneeId: string;
  assigneeName: string;
  createdBy: string;
  createdAt: string;
  dueAt?: string;
  source: string; // "risk-flag:ME-attendance", "approval:wv1", etc.
  status: "open" | "done" | "cancelled";
  note?: string;
}

interface TaskStore {
  tasks: Task[];
  addTask: (t: Omit<Task, "id" | "createdAt" | "status">) => Task;
  closeTask: (id: string) => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [],
      addTask: (t) => {
        const task: Task = {
          ...t,
          id: `tsk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
          status: "open",
        };
        set((s) => ({ tasks: [task, ...s.tasks] }));
        return task;
      },
      closeTask: (id) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: "done" } : t)) })),
    }),
    { name: "lnx-tasks" }
  )
);
