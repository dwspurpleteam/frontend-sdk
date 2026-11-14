import assert from 'node:assert/strict';
import test from 'node:test';
import { init, PluginSdkError } from '../src/index.js';
import { FakeWindow, requestId, validParams } from './helpers.js';

function iframeWindow(): FakeWindow {
  const window = new FakeWindow();
  window.parent = { postMessage: (message, targetOrigin) => window.sent.push({ message, targetOrigin }) };
  return window;
}

test('handles parallel requests independently', async () => {
  const window = iframeWindow();
  const sdk = init({ window: window as unknown as Window });
  const first = sdk.getLaunchParams();
  const second = sdk.getLaunchParams();
  assert.notEqual(requestId(window), requestId(window, 1));
  window.respond({ type: 'PluginGetLaunchParamsResult', requestId: requestId(window, 1), data: { ...validParams, call: { ...validParams.call, id: 'second' } } });
  window.respond({ type: 'PluginGetLaunchParamsResult', requestId: requestId(window), data: validParams });
  assert.equal((await first).call.id, 'call-1');
  assert.equal((await second).call.id, 'second');
});

test('times out only the unanswered request', async () => {
  const window = iframeWindow();
  const sdk = init({ window: window as unknown as Window, timeoutMs: 10 });
  await assert.rejects(sdk.getLaunchParams(), (error: unknown) => error instanceof PluginSdkError && error.code === 'HOST_RESPONSE_TIMEOUT');
});

test('preserves the host error code and message', async () => {
  const window = iframeWindow();
  const promise = init({ window: window as unknown as Window }).getLaunchParams();
  window.respond({ type: 'PluginGetLaunchParamsError', requestId: requestId(window), error: { code: 'LAUNCH_CONTEXT_NOT_READY', message: 'Wait for connection' } });
  await assert.rejects(promise, (error: unknown) => error instanceof PluginSdkError && error.code === 'HOST_ERROR' && error.hostCode === 'LAUNCH_CONTEXT_NOT_READY' && error.hostMessage === 'Wait for connection');
});

test('rejects outside an iframe and after destroy', async () => {
  const topLevel = new FakeWindow();
  await assert.rejects(init({ window: topLevel as unknown as Window }).getLaunchParams(), (error: unknown) => error instanceof PluginSdkError && error.code === 'INVALID_OPTIONS');

  const window = iframeWindow();
  const sdk = init({ window: window as unknown as Window });
  const pending = sdk.getLaunchParams();
  sdk.destroy();
  await assert.rejects(pending, (error: unknown) => error instanceof PluginSdkError && error.code === 'SDK_DESTROYED');
  await assert.rejects(sdk.getLaunchParams(), (error: unknown) => error instanceof PluginSdkError && error.code === 'SDK_DESTROYED');
});
