type ConfirmRequest = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  dismissOnBackdrop?: boolean;
};

type ConfirmHandler = (request: ConfirmRequest) => Promise<boolean>;

let confirmHandler: ConfirmHandler | null = null;

export function registerAppConfirmHandler(handler: ConfirmHandler | null): void {
  confirmHandler = handler;
}

/** Promise-based confirm for non-React call sites. Falls back to true only when no host. */
export async function appConfirm(request: ConfirmRequest): Promise<boolean> {
  if (!confirmHandler) {
    return false;
  }
  return confirmHandler(request);
}
