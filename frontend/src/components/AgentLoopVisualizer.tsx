import { useState, useEffect } from "react";
import { Brain, Play, Terminal, BarChart3, RefreshCw } from "lucide-react";
import type { LoopPhase } from "../types/harness";
import { useTask } from "../hooks/useHarnessState";

const phases: { key: LoopPhase; label: string; icon: typeof Brain }[] = [
  { key: "phase_reasoning", label: "Reason", icon: Brain },
  { key: "phase_action", label: "Action", icon: Play },
  { key: "execution_completed", label: "Execute", icon: Terminal },
  { key: "evaluation_completed", label: "Evaluate", icon: BarChart3 },
  { key: "phase_feedback", label: "Feedback", icon: RefreshCw },
];

interface AgentLoopVisualizerProps {
  taskId: string | null;
  className?: string;
}

export function AgentLoopVisualizer({ taskId, className = "" }: AgentLoopVisualizerProps) {
  const task = useTask(taskId);

  // Hooks must be at top level — never after early returns
  const [animPhase, setAnimPhase] = useState(0);
  useEffect(() => {
    if (!task || task.status !== "running") return;
    const interval = setInterval(() => setAnimPhase((p) => (p + 1) % 5), 1500);
    return () => clearInterval(interval);
  }, [task?.status]);

  if (!task) {
    return (
      <div className={className}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Agent Loop
        </h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
          Select a task to view details
        </p>
      </div>
    );
  }

  if (task.status === "pending" || task.status === "queued") {
    return (
      <div className={className}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-amber-500" />
          Agent Loop
          <span className="text-xs font-normal text-gray-400 ml-auto">Queued</span>
        </h2>
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Waiting to execute...</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{task.description}</p>
          <div className="mt-4 space-y-2">
            {phases.map((phase) => (
              <div key={phase.key} className="flex items-center gap-3 mb-3 opacity-50">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400 dark:bg-gray-700">
                  <phase.icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-400">{phase.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentPhase = task.currentPhase;
  const isRunning = task.status === "running";
  const isCompleted = task.status === "completed";

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <RefreshCw className={`w-5 h-5 ${isRunning ? "animate-spin text-blue-500" : isCompleted ? "text-green-500" : ""}`} />
        Agent Loop
        <span className="text-xs font-normal text-gray-400 ml-auto">
          Iteration {task.currentIteration}/{task.maxIterations}
        </span>
      </h2>

      <div className="relative">
        {phases.map((phase, i) => {
          const explicitActive = currentPhase === phase.key;
          const animatedActive = isRunning && i === animPhase;
          const isActive = explicitActive || animatedActive;
          const isPast = (isCompleted || task.currentIteration > 0) && !isActive;
          const Icon = phase.icon;

          return (
            <div key={phase.key} className="flex items-center gap-3 mb-3">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/30"
                    : isPast
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-700"
                }`}
              >
                {isActive ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-sm ${
                  isActive
                    ? "font-medium text-blue-600 dark:text-blue-400"
                    : isPast
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {phase.label}
              </span>
              {i < phases.length - 1 && (
                <div
                  className="hidden"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
