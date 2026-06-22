import { cn } from "@/lib/cn";
import type { LabelHTMLAttributes, ReactNode } from "react";

export type FieldProps = {
  label: ReactNode;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
};

export function Field({ label, error, hint, htmlFor, children, className, required }: FieldProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        htmlFor={htmlFor}
      >
        {label}
        {required ? " *" : null}
      </label>
      {hint ? (
        <span className="text-xs text-muted-foreground" id={hintId(htmlFor)}>
          {hint}
        </span>
      ) : null}
      {children}
      <FieldError error={error} id={errorId(htmlFor)} />
    </div>
  );
}

export type FieldErrorProps = {
  error?: string;
  id?: string;
};

export function FieldError({ error, id }: FieldErrorProps) {
  return (
    <span
      className={cn("min-h-[1.25rem] text-xs text-destructive", !error && "invisible")}
      data-visible={Boolean(error)}
      id={id}
      role={error ? "alert" : undefined}
    >
      {error ?? "This field needs a valid value."}
    </span>
  );
}

export function fieldHintId(id?: string) {
  return id ? `${id}-hint` : undefined;
}

export function fieldErrorId(id?: string) {
  return id ? `${id}-error` : undefined;
}

function hintId(id?: string) {
  return id ? `${id}-hint` : undefined;
}

function errorId(id?: string) {
  return id ? `${id}-error` : undefined;
}

export type FieldLabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode;
};

export function FieldLabel({ children, className, ...props }: FieldLabelProps) {
  return (
    <label className={cn("text-sm font-medium", className)} {...props}>
      {children}
    </label>
  );
}
