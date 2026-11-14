import type { LaunchParams } from './types.js';

export const MESSAGE_TYPES = {
  getLaunchParams: 'PluginGetLaunchParams',
  launchParamsResult: 'PluginGetLaunchParamsResult',
  launchParamsError: 'PluginGetLaunchParamsError',
} as const;

export interface GetLaunchParamsMessage {
  type: typeof MESSAGE_TYPES.getLaunchParams;
  requestId: string;
}

export interface LaunchParamsResultMessage {
  type: typeof MESSAGE_TYPES.launchParamsResult;
  requestId: string;
  data: LaunchParams;
}

export interface LaunchParamsErrorMessage {
  type: typeof MESSAGE_TYPES.launchParamsError;
  requestId: string;
  error: { code: 'LAUNCH_CONTEXT_NOT_READY' | 'INVALID_REQUEST'; message: string };
}

export type HostResponseMessage = LaunchParamsResultMessage | LaunchParamsErrorMessage;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Проверяет только структуру транспорта; payload проверяется в validation.ts. */
export function isHostResponseMessage(value: unknown): value is HostResponseMessage {
  if (!isRecord(value) || typeof value.requestId !== 'string') return false;
  if (value.type === MESSAGE_TYPES.launchParamsResult) return 'data' in value;
  return value.type === MESSAGE_TYPES.launchParamsError
    && isRecord(value.error)
    && (value.error.code === 'LAUNCH_CONTEXT_NOT_READY' || value.error.code === 'INVALID_REQUEST')
    && typeof value.error.message === 'string';
}
