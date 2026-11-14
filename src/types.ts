export interface LaunchParams {
  call: { id: string; name: string };
  user: {
    id: string;
    displayName: string;
    photoUrl?: string;
    isGuest: boolean;
  };
  session: { id: string };
}

export interface PluginSdkOptions {
  /** Максимальное время ожидания ответа Host Frontend. По умолчанию 5000 мс. */
  timeoutMs?: number;
  /** Подменяемый объект Window для тестов. */
  window?: Window;
}

export interface PluginSdk {
  getLaunchParams(): Promise<LaunchParams>;
  destroy(): void;
}

export type PluginSdkErrorCode =
  | 'INVALID_OPTIONS'
  | 'HOST_RESPONSE_TIMEOUT'
  | 'HOST_ERROR'
  | 'INVALID_RESPONSE'
  | 'SDK_DESTROYED';

export class PluginSdkError extends Error {
  public readonly hostCode?: string;
  public readonly hostMessage?: string;

  public constructor(
    public readonly code: PluginSdkErrorCode,
    message: string,
    hostError?: { code: string; message: string },
  ) {
    super(message);
    this.name = 'PluginSdkError';
    this.hostCode = hostError?.code;
    this.hostMessage = hostError?.message;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
