import { useHardnessStore } from "../store/hardnessStore";

export function useTasks() {
  return useHardnessStore((s) => s.tasks);
}

export function useTask(taskId: string | null) {
  return useHardnessStore((s) => s.tasks.find((t) => t.id === taskId) ?? null);
}

export function usePendingApprovals() {
  return useHardnessStore((s) => s.pendingApprovals);
}

export function useSystemMetrics() {
  return useHardnessStore((s) => s.systemMetrics);
}

export function useSelectedTaskId() {
  return useHardnessStore((s) => s.selectedTaskId);
}

export function useAuditLog() {
  return useHardnessStore((s) => s.auditLog);
}
