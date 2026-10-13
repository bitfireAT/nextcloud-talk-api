// OCS envelope parsing and error mapping; messages are built from the payload only, never the URL.

const BODY_EXCERPT_LIMIT = 200;

export const STATUS_MESSAGES: Readonly<Record<number, string>> = {
  401: 'Authentication failed: the user or app password is wrong.',
  403: 'The user is not allowed to post in that room.',
  404: 'The room token does not exist on that server.',
  413: 'The message is too long for the server.',
  429: 'Nextcloud rate-limited the request; try again later.'
};

export class TalkError extends Error {
  constructor(
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'TalkError';
  }
}

interface OcsEnvelope {
  ocs?: {
    meta?: { statuscode?: unknown; message?: unknown };
    data?: { id?: unknown };
  };
}

function parseEnvelope(body: string): OcsEnvelope | undefined {
  try {
    return JSON.parse(body) as OcsEnvelope;
  } catch {
    return undefined;
  }
}

function bodyExcerpt(body: string): string {
  return body.slice(0, BODY_EXCERPT_LIMIT);
}

/**
 * Checks HTTP and OCS status, returns the sent message's id.
 * @throws {TalkError} on any mapped or unmapped server error
 */
export function checkResponse(httpStatus: number, body: string): number {
  const envelope = parseEnvelope(body);
  const ocsStatus =
    typeof envelope?.ocs?.meta?.statuscode === 'number' ? envelope.ocs.meta.statuscode : undefined;

  const errorStatus = httpStatus >= 400 ? httpStatus : ocsStatus !== undefined && ocsStatus >= 400 ? ocsStatus : undefined;
  if (errorStatus !== undefined) {
    const mapped = STATUS_MESSAGES[errorStatus];
    if (mapped) {
      throw new TalkError(errorStatus, mapped);
    }
    const serverMessage = typeof envelope?.ocs?.meta?.message === 'string' ? envelope.ocs.meta.message : undefined;
    throw new TalkError(
      errorStatus,
      serverMessage
        ? `Nextcloud returned an error (status ${errorStatus}): ${serverMessage}`
        : `Request failed with status ${errorStatus}: ${bodyExcerpt(body)}`
    );
  }

  if (httpStatus < 200 || httpStatus >= 300) {
    const serverMessage = typeof envelope?.ocs?.meta?.message === 'string' ? envelope.ocs.meta.message : undefined;
    throw new TalkError(
      httpStatus,
      serverMessage
        ? `Nextcloud returned an error (status ${httpStatus}): ${serverMessage}`
        : `Request failed with status ${httpStatus}: ${bodyExcerpt(body)}`
    );
  }

  const id = envelope?.ocs?.data?.id;
  if (id !== undefined && id !== null && !Number.isNaN(Number(id))) {
    return Number(id);
  }

  throw new TalkError(httpStatus, `Unexpected response from server: ${bodyExcerpt(body)}`);
}
