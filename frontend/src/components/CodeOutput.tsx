import { Code2, FileText } from "lucide-react";
import { useTask } from "../hooks/useHarnessState";

interface CodeOutputProps {
  taskId: string | null;
  className?: string;
}

export function CodeOutput({ taskId, className = "" }: CodeOutputProps) {
  const task = useTask(taskId);

  if (!task || task.status !== "completed") {
    return null;
  }

  const result = task.result as any;
  const actions = result?.results || [];

  const writeActions = actions.filter(
    (a: any) => a.action?.tool === "write_file" && a.status === "success"
  );

  if (writeActions.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Code2 className="w-5 h-5" />
        Generated Code
      </h2>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {writeActions.map((a: any, i: number) => {
          const params = a.action?.params || {};
          const filePath = params.file_path || params.path || "output";
          const content = params.content || "";
          const lines = content.split("\n").length;

          return (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-mono text-gray-700 dark:text-gray-300">{filePath}</span>
                <span className="text-xs text-gray-400 ml-auto">{lines} lines</span>
              </div>
              <pre className="p-3 text-xs font-mono text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 overflow-x-auto whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {content}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
