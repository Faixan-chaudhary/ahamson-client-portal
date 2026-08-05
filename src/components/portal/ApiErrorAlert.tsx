import { AlertCircle } from "lucide-react";

interface ApiErrorAlertProps {
  message: string | null;
  onRetry?: () => void;
}

export function ApiErrorAlert({ message, onRetry }: ApiErrorAlertProps) {
  if (!message) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        <p>{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="mt-1 font-medium underline hover:no-underline">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
