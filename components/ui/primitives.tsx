import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "success" | "warning" | "danger" | "violet" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Progress({ value, label }: { value: number; label?: string }) {
  const normalized = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-wrap" aria-label={label ?? `Прогресс ${normalized}%`}>
      <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={normalized}><span style={{ width: `${normalized}%` }} /></div>
      {label ? <span className="progress-label">{label}</span> : null}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, action, id }: { eyebrow?: string; title: string; action?: ReactNode; id?: string }) {
  return (
    <div className="section-title">
      <div>
        {eyebrow ? <p>{eyebrow}</p> : null}
        <h2 id={id}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return <div className="empty-state"><div>{icon}</div><h3>{title}</h3><p>{text}</p>{action}</div>;
}

export function Card({ children, className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={`panel content-panel ${className}`.trim()} {...props}>{children}</article>;
}

export function Button({ children, variant = "primary", size = "normal", className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "text" | "danger"; size?: "small" | "normal" }) {
  const base = variant === "primary" ? "primary-button" : variant === "ghost" ? "ghost-button" : variant === "text" ? "text-button" : "danger-button";
  return <button type={type} className={`${base} ${size === "small" ? "small" : ""} ${className}`.trim()} {...props}>{children}</button>;
}

export function IconButton({ label, children, className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return <button type={type} className={`icon-button ${className}`.trim()} aria-label={label} title={props.title ?? label} {...props}>{children}</button>;
}

export function Notice({ icon, title, children, tone = "info" }: { icon?: ReactNode; title: string; children: ReactNode; tone?: "info" | "success" | "warning" | "danger" }) {
  return <div className={`ui-notice ui-notice-${tone}`} role={tone === "danger" ? "alert" : "status"}>{icon}<div><strong>{title}</strong><span>{children}</span></div></div>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`ui-skeleton ${className}`.trim()} aria-hidden="true" />;
}

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
