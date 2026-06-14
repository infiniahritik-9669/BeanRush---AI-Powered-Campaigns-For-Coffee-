"use client";

import { Toast, ToastTitle, ToastDescription, ToastClose, useToast } from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 max-w-md">
      {toasts.map((t) => (
        <Toast key={t.id} variant={t.variant as "default" | "destructive" | "success" | undefined}>
          <div className="flex flex-col gap-1">
            <ToastTitle>{t.title}</ToastTitle>
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
    </div>
  );
}