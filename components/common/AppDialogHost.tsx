import { useEffect, useState } from 'react';

import { ConfirmSheet } from '@/components/common/ConfirmSheet';
import { registerAppConfirmHandler } from '@/lib/ui/appDialog';

type Pending = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  dismissOnBackdrop?: boolean;
  resolve: (value: boolean) => void;
};

export function AppDialogHost() {
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    registerAppConfirmHandler(
      (request) =>
        new Promise<boolean>((resolve) => {
          setPending({ ...request, resolve });
        }),
    );
    return () => {
      registerAppConfirmHandler(null);
    };
  }, []);

  return (
    <ConfirmSheet
      visible={pending !== null}
      title={pending?.title ?? ''}
      message={pending?.message}
      confirmLabel={pending?.confirmLabel}
      cancelLabel={pending?.cancelLabel}
      destructive={pending?.destructive}
      dismissOnBackdrop={pending?.dismissOnBackdrop ?? true}
      onCancel={() => {
        pending?.resolve(false);
        setPending(null);
      }}
      onConfirm={() => {
        pending?.resolve(true);
        setPending(null);
      }}
    />
  );
}
