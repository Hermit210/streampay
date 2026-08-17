import type { PropsWithChildren, ReactNode } from 'react';
import './ui.css';

export function Card({
  title,
  actions,
  children,
}: PropsWithChildren<{ title?: string; actions?: ReactNode }>) {
  return (
    <div className="card">
      {(title || actions) && (
        <div className="card-header">
          {title && <h2>{title}</h2>}
          {actions}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}
