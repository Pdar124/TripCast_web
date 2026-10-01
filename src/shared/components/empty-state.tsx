import { CircleAlert, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  variant?: 'empty' | 'error';
};

export function EmptyState({ title, description, action, variant = 'empty' }: EmptyStateProps) {
  const Icon = variant === 'error' ? CircleAlert : Inbox;

  return (
    <section
      className="grid justify-items-center gap-4 rounded-lg border bg-card px-6 py-12 text-center"
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="space-y-2">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action}
    </section>
  );
}
