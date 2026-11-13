interface StatusMessageProps {
  kind: 'loading' | 'empty' | 'error';
  children: string;
}

export function StatusMessage({ kind, children }: StatusMessageProps) {
  return (
    <p className={`status status-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  );
}
