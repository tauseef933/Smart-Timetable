export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function formatClassLabel(className: string, section: string): string {
  return `${className} – Sec ${section}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function friendlyError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}
