import { Bridge } from './bridge.js';
import { MESSAGE_TYPES } from './messages.js';
import { PluginSdkError, type LaunchParams, type PluginSdk, type PluginSdkOptions } from './types.js';
import { parseLaunchParams } from './validation.js';

const DEFAULT_TIMEOUT_MS = 5_000;

class PluginSdkImpl implements PluginSdk {
  private readonly bridge?: Bridge;
  private readonly invalidOptionsMessage?: string;
  private destroyed = false;
  private sequence = 0;

  public constructor(options: PluginSdkOptions = {}) {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      this.invalidOptionsMessage = 'timeoutMs must be a positive finite number';
      return;
    }
    const window = options.window ?? (typeof globalThis.window === 'undefined' ? undefined : globalThis.window);
    if (!window) {
      this.invalidOptionsMessage = 'Требуется browser window';
      return;
    }
    if (window.parent === window) {
      this.invalidOptionsMessage = 'Plugin SDK должен работать внутри iframe';
      return;
    }
    this.bridge = new Bridge(window, timeoutMs);
  }

  public async getLaunchParams(): Promise<LaunchParams> {
    if (this.destroyed) throw new PluginSdkError('SDK_DESTROYED', 'SDK уже уничтожен');
    if (!this.bridge) throw new PluginSdkError('INVALID_OPTIONS', this.invalidOptionsMessage ?? 'Некорректные параметры SDK');

    const response = await this.bridge.request(this.nextRequestId());
    if (response.type === MESSAGE_TYPES.launchParamsError) {
      throw new PluginSdkError('HOST_ERROR', response.error.message, response.error);
    }
    return parseLaunchParams(response.data);
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.bridge?.destroy();
  }

  private nextRequestId(): string {
    this.sequence += 1;
    const cryptoApi = globalThis.crypto;
    if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
    return `plugin-sdk-${Date.now()}-${this.sequence}-${Math.random().toString(36).slice(2)}`;
  }
}

export function init(options?: PluginSdkOptions): PluginSdk {
  return new PluginSdkImpl(options);
}
