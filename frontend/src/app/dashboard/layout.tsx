import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <section className="min-h-screen bg-slate-50">{children}</section>;
}
