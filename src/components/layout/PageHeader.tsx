import { Clock } from "lucide-react";
import { timeAgo } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  lastUpdate?: number;
}

export function PageHeader({ title, description, lastUpdate }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-border/40">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h1>
        {description && (
          <p className="text-sm text-[var(--text-secondary)] mt-1.5">{description}</p>
        )}
      </div>
      
      {lastUpdate && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] bg-[var(--bg-elevated)]/50 px-3 py-1.5 rounded-full border border-border/50">
          <Clock className="size-3.5" />
          <span>Last updated: {timeAgo(lastUpdate)}</span>
        </div>
      )}
    </div>
  );
}
