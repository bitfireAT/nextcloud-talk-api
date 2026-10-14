// Request building for the Nextcloud Talk chat API on top of @actions/http-client.

import { HttpClient } from '@actions/http-client';
import { BasicCredentialHandler } from '@actions/http-client/lib/auth';
import { checkResponse, TalkError } from './ocs.js';

const CHAT_API_PATH = '/ocs/v2.php/apps/spreed/api/v1/chat/';

export interface PostMessageOptions {
  silent?: boolean;
  replyTo?: number;
  referenceId?: string;
}

export interface HttpResponseLike {
  readonly message: { readonly statusCode?: number };
  readBody(): Promise<string>;
}

export interface HttpClientLike {
  post(requestUrl: string, data: string, additionalHeaders?: Record<string, string>): Promise<HttpResponseLike>;
}

export function chatEndpoint(serverUrl: string, roomToken: string): string {
  const base = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
  return `${base}${CHAT_API_PATH}${encodeURIComponent(roomToken)}`;
}

export function requestHeaders(): Record<string, string> {
  return {
    'OCS-APIRequest': 'true',
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded'
  };
}

/** Form fields for the chat API; optional fields are omitted when unset. */
export function formFields(message: string, options: PostMessageOptions = {}): Record<string, string> {
  const fields: Record<string, string> = { message };
  if (options.silent !== undefined) {
    fields.silent = String(options.silent);
  }
  if (options.replyTo !== undefined) {
    fields.replyTo = String(options.replyTo);
  }
  if (options.referenceId !== undefined && options.referenceId !== '') {
    fields.referenceId = options.referenceId;
  }
  return fields;
}

export class TalkClient {
  readonly serverUrl: string;
  private readonly http: HttpClientLike;

  constructor(
    serverUrl: string,
    user: string,
    appPassword: string,
    http?: HttpClientLike
  ) {
    this.serverUrl = serverUrl;
    this.http = http ?? new HttpClient('nextcloud-talk-api', [new BasicCredentialHandler(user, appPassword)]);
  }

  /** Sends one chat message and returns the created message's id. */
  async postMessage(roomToken: string, message: string, options: PostMessageOptions = {}): Promise<number> {
    const url = chatEndpoint(this.serverUrl, roomToken);
    const body = new URLSearchParams(formFields(message, options)).toString();
    const response = await this.http.post(url, body, requestHeaders());
    try {
      return checkResponse(response.message.statusCode ?? 0, await response.readBody());
    } catch (error) {
      if (error instanceof TalkError) {
        throw new TalkError(error.statusCode, mask(url, roomToken, error.message));
      }
      throw error;
    }
  }
}

/** Strips the request URL and room token from server-provided error text. */
function mask(url: string, roomToken: string, text: string): string {
  return text.replaceAll(url, '***').replaceAll(roomToken, '***');
}
