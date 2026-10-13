// Send-message command: read inputs, mask the token, send, publish the message id.

import type { TalkClient } from '../../client/talk-client.js';
import type { SendMessageInputs } from './inputs.js';
import { readInputs } from './inputs.js';

export interface CoreLike {
  getInput(name: string): string;
  setSecret(secret: string): void;
  setOutput(name: string, value: string): void;
  setFailed(message: string): void;
}

export interface RunDeps {
  core: CoreLike;
  createClient(serverUrl: string, user: string, appPassword: string): Pick<TalkClient, 'postMessage'>;
}

export async function run(deps: RunDeps): Promise<void> {
  let inputs: SendMessageInputs;
  try {
    inputs = readInputs((name) => deps.core.getInput(name));
    deps.core.setSecret(inputs.roomToken);

    const client = deps.createClient(inputs.serverUrl, inputs.user, inputs.appPassword);
    const messageId = await client.postMessage(inputs.roomToken, inputs.message, {
      silent: inputs.silent,
      replyTo: inputs.replyTo,
      referenceId: inputs.referenceId
    });

    deps.core.setOutput('message-id', String(messageId));
  } catch (error) {
    deps.core.setFailed(error instanceof Error ? error.message : String(error));
  }
}
