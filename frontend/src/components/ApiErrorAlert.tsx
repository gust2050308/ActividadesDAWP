/**
 * components/ApiErrorAlert.tsx
 * =============================
 * Muestra errores generales de red o del servidor (no errores de campo).
 */

interface ApiErrorAlertProps {
    message: string;
}

export function ApiErrorAlert({ message }: ApiErrorAlertProps) {
    return (
        <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mt-0.5 h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>{message}</p>
        </div>
    );
}
