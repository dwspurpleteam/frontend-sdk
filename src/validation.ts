import { PluginSdkError, type LaunchParams } from './types.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const nonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/** Parses untrusted postMessage data into the public launch-context contract. */
export function parseLaunchParams(value: unknown): LaunchParams {
  if (!isRecord(value) || !isRecord(value.call) || !isRecord(value.user) || !isRecord(value.session)) {
    throw invalidResponse();
  }

  const { call, user, session } = value;
  if (
    !nonEmptyString(call.id) || !nonEmptyString(call.name) ||
    !nonEmptyString(user.id) || !nonEmptyString(user.displayName) ||
    !nonEmptyString(session.id) || typeof user.isGuest !== 'boolean' ||
    ('photoUrl' in user && !nonEmptyString(user.photoUrl))
  ) {
    throw invalidResponse();
  }

  // Проверки выше устанавливают публичную форму; исходные записи намеренно имеют тип unknown.
  const photoUrl = user.photoUrl as string | undefined;

  return {
    call: { id: call.id, name: call.name },
    user: {
      id: user.id,
      displayName: user.displayName,
      ...(photoUrl === undefined ? {} : { photoUrl }),
      isGuest: user.isGuest,
    },
    session: { id: session.id },
  };
}

function invalidResponse(): PluginSdkError {
  return new PluginSdkError('INVALID_RESPONSE', 'Host вернул некорректные LaunchParams');
}
