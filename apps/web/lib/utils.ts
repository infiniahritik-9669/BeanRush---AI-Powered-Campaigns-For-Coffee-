import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    sending: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    queued: "bg-yellow-100 text-yellow-800",
    sent: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    opened: "bg-purple-100 text-purple-800",
    clicked: "bg-indigo-100 text-indigo-800",
    converted: "bg-emerald-100 text-emerald-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function personalizeMessage(template: string, name: string): string {
  return template.replace(/\{\{name\}\}/g, name);
}