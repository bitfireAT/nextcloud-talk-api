import * as core from '@actions/core';
import { TalkClient } from '../../client/talk-client.js';
import { run } from './run.js';

void run({
  core,
  createClient: (serverUrl, user, appPassword) => new TalkClient(serverUrl, user, appPassword)
});
