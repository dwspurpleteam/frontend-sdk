import assert from 'node:assert/strict';
import test from 'node:test';
import { init } from '../src/index.js';
import { FakeWindow, requestId, validParams } from './helpers.js';

test('posts a request to parent with targetOrigin wildcard and accepts any origin', async () => {
  const window = new FakeWindow();
  window.parent = window;
  // Отдельный объект parent имитирует iframe и одновременно записывает запрос.
  const parent = { postMessage: (message: unknown, targetOrigin: string) => window.sent.push({ message, targetOrigin }) };
  window.parent = parent;
  const promise = init({ window: window as unknown as Window }).getLaunchParams();
  assert.equal(window.sent[0].targetOrigin, '*');
  window.respond({ type: 'PluginGetLaunchParamsResult', requestId: requestId(window), data: validParams }, 'https://untrusted.example');
  assert.deepEqual(await promise, validParams);
});

test('ignores malformed and foreign request responses', async () => {
  const window = new FakeWindow();
  window.parent = { postMessage: (message, targetOrigin) => window.sent.push({ message, targetOrigin }) };
  const promise = init({ window: window as unknown as Window }).getLaunchParams();
  window.respond({ type: 'PluginGetLaunchParamsResult', requestId: 'other', data: validParams });
  window.respond({ type: 'unknown', requestId: requestId(window) });
  let settled = false;
  void promise.then(() => { settled = true; });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(settled, false);
  window.respond({ type: 'PluginGetLaunchParamsResult', requestId: requestId(window), data: validParams });
  await promise;
});
