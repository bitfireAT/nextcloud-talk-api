import { describe, expect, it } from 'vitest';
import { checkResponse, STATUS_MESSAGES, TalkError } from './ocs.js';

function envelope(statuscode: number, message = '', id?: number): string {
  return JSON.stringify({ ocs: { meta: { status: statuscode < 400 ? 'ok' : 'failure', statuscode, message }, data: { id } } });
}

describe('checkResponse()', () => {
  it('returns the message id for a successful response', () => {
    expect(checkResponse(201, envelope(201, 'OK', 42))).toBe(42);
  });

  it('accepts an id delivered as a numeric string', () => {
    expect(checkResponse(200, JSON.stringify({ ocs: { meta: { statuscode: 200 }, data: { id: '42' } } }))).toBe(42);
  });

  it.each([
    [401, 'user or app password is wrong'],
    [403, 'not allowed to post in that room'],
    [404, 'room token does not exist'],
    [413, 'message is too long'],
    [429, 'rate-limited']
  ])('maps HTTP %i to a distinct plain-language message', (status, expectedFragment) => {
    const assertion = expect(() => checkResponse(status, envelope(status, 'ignored', 42)));
    assertion.toThrow(TalkError);
    assertion.toThrow(new RegExp(expectedFragment, 'i'));
  });

  it('uses the mapping table for every documented status', () => {
    expect(Object.keys(STATUS_MESSAGES).sort()).toEqual(['401', '403', '404', '413', '429']);
  });

  it('catches an OCS error inside HTTP 200 and maps it by the OCS status code', () => {
    expect(() => checkResponse(200, envelope(404, 'room not found'))).toThrow(/room token does not exist/i);
  });

  it('reports the OCS status code and server message for an unmapped OCS error', () => {
    expect(() => checkResponse(200, envelope(500, 'internal blorb error'))).toThrow(
      /status 500\): internal blorb error/i
    );
  });

  it('falls back to status and body excerpt for a non-2xx response without an OCS envelope', () => {
    expect(() => checkResponse(502, '<html>gateway exploded</html>')).toThrow(
      /status 502: <html>gateway exploded<\/html>/i
    );
  });

  it('fails on a 2xx response without a usable message id', () => {
    expect(() => checkResponse(200, envelope(200, 'OK', undefined))).toThrow(/unexpected response/i);
  });
});
