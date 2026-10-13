// Input reading and required-input validation; fails before any network request.

export interface SendMessageInputs {
  readonly serverUrl: string;
  readonly user: string;
  readonly appPassword: string;
  readonly roomToken: string;
  readonly message: string;
  readonly silent: boolean;
  readonly replyTo?: number;
  readonly referenceId?: string;
}

export interface InputGetter {
  (name: string): string;
}

export function readInputs(get: InputGetter): SendMessageInputs {
  const required = (name: string): string => {
    const value = get(name).trim();
    if (!value) {
      throw new Error(`Missing required input: ${name}`);
    }
    return value;
  };

  const replyToRaw = get('reply-to').trim();
  let replyTo: number | undefined;
  if (replyToRaw) {
    const parsed = Number(replyToRaw);
    if (!Number.isInteger(parsed)) {
      throw new Error('Invalid input: reply-to must be a message id');
    }
    replyTo = parsed;
  }

  return {
    serverUrl: required('server-url'),
    user: required('user'),
    appPassword: required('app-password'),
    roomToken: required('room-token'),
    message: required('message'),
    silent: get('silent').trim().toLowerCase() === 'true',
    replyTo,
    referenceId: get('reference-id').trim() || undefined
  };
}
