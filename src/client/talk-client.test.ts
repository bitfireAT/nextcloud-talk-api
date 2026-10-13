import { describe, expect, it, vi } from 'vitest';
import { HttpClient } from '@actions/http-client';
import { BasicCredentialHandler } from '@actions/http-client/lib/auth';
import { TalkError } from './ocs.js';
import { chatEndpoint, formFields, requestHeaders, TalkClient, type HttpClientLike } from './talk-client.js';

const SERVER = 'https://cloud.example.com';
const TOKEN = 'r00m-t0k3n';

function fakeHttp(statusCode: number, body: string): HttpClientLike & { calls: Array<{ url: string; body: string; headers?: Record<string, string> }> } {
  const calls: Array<{ url: string; body: string; headers?: Record<string, string> }> = [];
  return {
    calls,
    post: vi.fn(async (url: string, requestBody: string, headers?: Record<string, string>) => {
      calls.push({ url, body: requestBody, headers });
      return { message: { statusCode }, readBody: async () => body };
    })
  };
}

describe('chatEndpoint()', () => {
  it('builds the chat API URL with the token encoded', () => {
    expect(chatEndpoint(SERVER, TOKEN)).toBe(`${SERVER}/ocs/v2.php/apps/spreed/api/v1/chat/${TOKEN}`);
  });

  it('encodes special characters in the token and tolerates a trailing slash in the server URL', () => {
    expect(chatEndpoint(`${SERVER}/`, 'a b')).toBe(`${SERVER}/ocs/v2.php/apps/spreed/api/v1/chat/a%20b`);
  });
});

describe('requestHeaders()', () => {
  it('sets the OCS API request header', () => {
    expect(requestHeaders()).toEqual({ 'OCS-APIRequest': 'true', Accept: 'application/json' });
  });
});

describe('formFields()', () => {
  it('omits optional fields when no options are given', () => {
    expect(formFields('hello')).toEqual({ message: 'hello' });
  });

  it('forwards silent, replyTo, and referenceId when provided', () => {
    expect(formFields('hello', { silent: true, replyTo: 42, referenceId: 'ref-1' })).toEqual({
      message: 'hello',
      silent: 'true',
      replyTo: '42',
      referenceId: 'ref-1'
    });
  });

  it('omits an empty reference id', () => {
    expect(formFields('hello', { referenceId: '' })).toEqual({ message: 'hello' });
  });
});

describe('TalkClient.postMessage()', () => {
  it('posts form-encoded body with OCS headers to the chat endpoint', async () => {
    const http = fakeHttp(201, JSON.stringify({ ocs: { meta: { statuscode: 201 }, data: { id: 42 } } }));
    const client = new TalkClient(SERVER, 'user', 'pass', http);

    await expect(client.postMessage(TOKEN, 'hello', { silent: true })).resolves.toBe(42);

    expect(http.calls).toHaveLength(1);
    const call = http.calls[0];
    expect(call.url).toBe(`${SERVER}/ocs/v2.php/apps/spreed/api/v1/chat/${TOKEN}`);
    expect(call.headers).toEqual(requestHeaders());
    expect(new URLSearchParams(call.body).get('message')).toBe('hello');
    expect(new URLSearchParams(call.body).get('silent')).toBe('true');
  });

  it('uses @actions/http-client with basic auth by default', () => {
    const client = new TalkClient(SERVER, 'user', 'pass');

    const internal = (client as unknown as { http: unknown }).http;
    expect(internal).toBeInstanceOf(HttpClient);

    const handler = new BasicCredentialHandler('user', 'pass');
    const options = { headers: {} as Record<string, string> };
    handler.prepareRequest(options);
    expect(options.headers.Authorization).toBe(`Basic ${Buffer.from('user:pass').toString('base64')}`);
  });

  it('never includes the room token or request URL in thrown error messages', async () => {
    const echoBody = `<html>failed call to ${SERVER}/ocs/v2.php/apps/spreed/api/v1/chat/${TOKEN}</html>`;
    const http = fakeHttp(500, echoBody);
    const client = new TalkClient(SERVER, 'user', 'pass', http);

    await expect(client.postMessage(TOKEN, 'hello')).rejects.toSatisfy((error: unknown) => {
      const message = error instanceof TalkError ? error.message : String(error);
      return !message.includes(TOKEN) && !message.includes(`${SERVER}/ocs/v2.php/apps/spreed/api/v1/chat/`);
    });
  });
});
