import { describe, expect, it } from 'vitest';
import { readInputs, type InputGetter } from './inputs.js';

const VALID: Record<string, string> = {
  'server-url': 'https://cloud.example.com',
  user: 'bot',
  'app-password': 'pass',
  'room-token': 'tok3n',
  message: 'hello'
};

function getWith(overrides: Record<string, string | undefined>): InputGetter {
  return (name: string) => (name in overrides ? (overrides[name] ?? '') : VALID[name] ?? '');
}

describe('readInputs()', () => {
  it('reads all required inputs', () => {
    const inputs = readInputs(getWith({}));

    expect(inputs.serverUrl).toBe(VALID['server-url']);
    expect(inputs.user).toBe('bot');
    expect(inputs.appPassword).toBe('pass');
    expect(inputs.roomToken).toBe('tok3n');
    expect(inputs.message).toBe('hello');
  });

  it.each(['server-url', 'user', 'app-password', 'room-token', 'message'])(
    'fails naming the input when %s is missing',
    (name) => {
      expect(() => readInputs(getWith({ [name]: undefined }))).toThrow(
        `Missing required input: ${name}`
      );
    }
  );

  it('fails when a required input is only whitespace', () => {
    expect(() => readInputs(getWith({ message: '   ' }))).toThrow('Missing required input: message');
  });

  it('parses silent as a boolean, case-insensitively', () => {
    expect(readInputs(getWith({ silent: 'true' })).silent).toBe(true);
    expect(readInputs(getWith({ silent: 'TRUE' })).silent).toBe(true);
    expect(readInputs(getWith({ silent: 'false' })).silent).toBe(false);
    expect(readInputs(getWith({ silent: '' })).silent).toBe(false);
  });

  it('parses reply-to as an integer message id', () => {
    expect(readInputs(getWith({ 'reply-to': '42' })).replyTo).toBe(42);
  });

  it('fails when reply-to is not a number', () => {
    expect(() => readInputs(getWith({ 'reply-to': 'forty-two' }))).toThrow(
      'Invalid input: reply-to must be a message id'
    );
  });

  it('reads reference-id and omits it when empty', () => {
    expect(readInputs(getWith({ 'reference-id': 'ref-1' })).referenceId).toBe('ref-1');
    expect(readInputs(getWith({ 'reference-id': '' })).referenceId).toBeUndefined();
  });
});
