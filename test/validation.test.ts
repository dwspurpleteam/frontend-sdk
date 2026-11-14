import assert from 'node:assert/strict';
import test from 'node:test';
import { PluginSdkError } from '../src/index.js';
import { parseLaunchParams } from '../src/validation.js';
import { validParams } from './helpers.js';

test('accepts valid LaunchParams and optional photoUrl', () => {
  const result = parseLaunchParams({ ...validParams, user: { ...validParams.user, photoUrl: 'https://cdn.test/a.png' } });
  assert.equal(result.user.photoUrl, 'https://cdn.test/a.png');
  assert.equal(parseLaunchParams(validParams).user.photoUrl, undefined);
});

test('rejects invalid and incomplete LaunchParams', () => {
  for (const value of [null, { ...validParams, call: { id: '', name: 'name' } }, { ...validParams, user: { ...validParams.user, photoUrl: '' } }]) {
    assert.throws(() => parseLaunchParams(value), (error: unknown) => error instanceof PluginSdkError && error.code === 'INVALID_RESPONSE');
  }
});
