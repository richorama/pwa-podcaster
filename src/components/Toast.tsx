import { useStore } from "../store";

export default function Toast() {
  const toasts = useStore((s) => s.toasts);
  const removeToast = useStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`px-4 py-3 rounded-lg shadow-lg cursor-pointer text-sm font-medium transition-all animate-slide-in ${
            toast.type === "error"
              ? "bg-red-600 text-white"
              : toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-slate-700 text-slate-100"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
