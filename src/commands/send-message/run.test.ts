import { describe, expect, it, vi } from 'vitest';
import { run } from './run.js';

const INPUTS: Record<string, string> = {
  'server-url': 'https://cloud.example.com',
  user: 'bot',
  'app-password': 'pass',
  'room-token': 'tok3n',
  message: 'hello',
  silent: 'true',
  'reply-to': '42',
  'reference-id': 'ref-1'
};

interface Posted {
  roomToken: string;
  message: string;
  options: { silent?: boolean; replyTo?: number; referenceId?: string };
}

function spyCore(overrides: Record<string, string> = {}) {
  return {
    getInput: vi.fn((name: string) => overrides[name] ?? INPUTS[name] ?? ''),
    setSecret: vi.fn(),
    setOutput: vi.fn(),
    setFailed: vi.fn()
  };
}

function fakeClient(posted: Posted[], result: Promise<number>) {
  const clientArgs: Array<{ serverUrl: string; user: string; appPassword: string }> = [];
  return {
    clientArgs,
    createClient: (serverUrl: string, user: string, appPassword: string) => {
      clientArgs.push({ serverUrl, user, appPassword });
      return {
        postMessage: (roomToken: string, message: string, options: Posted['options']) => {
          posted.push({ roomToken, message, options });
          return result;
        }
      };
    }
  };
}

describe('run()', () => {
  it('masks the room token, sends the message with options, and sets the message-id output', async () => {
    const core = spyCore();
    const posted: Posted[] = [];
    const { createClient } = fakeClient(posted, Promise.resolve(42));

    await run({ core, createClient });

    expect(core.setSecret).toHaveBeenCalledWith('tok3n');
    expect(posted).toEqual([
      {
        roomToken: 'tok3n',
        message: 'hello',
        options: { silent: true, replyTo: 42, referenceId: 'ref-1' }
      }
    ]);
    expect(core.setOutput).toHaveBeenCalledWith('message-id', '42');
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('creates the client with the connection inputs', async () => {
    const core = spyCore();
    const { createClient, clientArgs } = fakeClient([], Promise.resolve(42));

    await run({ core, createClient });

    expect(clientArgs).toEqual([
      { serverUrl: 'https://cloud.example.com', user: 'bot', appPassword: 'pass' }
    ]);
  });

  it('fails without calling the client when a required input is missing', async () => {
    const core = spyCore({ message: '' });
    const createClient = vi.fn();

    await run({ core, createClient });

    expect(createClient).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith('Missing required input: message');
    expect(core.setOutput).not.toHaveBeenCalled();
  });

  it('fails with the mapped error message when the client rejects', async () => {
    const core = spyCore();
    const { createClient } = fakeClient(
      [],
      Promise.reject(new Error('Authentication failed: the user or app password is wrong.'))
    );

    await run({ core, createClient });

    expect(core.setFailed).toHaveBeenCalledWith('Authentication failed: the user or app password is wrong.');
    expect(core.setOutput).not.toHaveBeenCalled();
  });
});
