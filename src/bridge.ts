import { isHostResponseMessage, MESSAGE_TYPES, type HostResponseMessage } from './messages.js';
import { PluginSdkError } from './types.js';

interface PendingRequest {
  timer: ReturnType<typeof setTimeout>;
  resolve: (response: HostResponseMessage) => void;
  reject: (reason: PluginSdkError) => void;
}

/** Сопоставляет ответы postMessage с запросами. В MVP origin и source намеренно не проверяются. */
export class Bridge {
  private readonly pending = new Map<string, PendingRequest>();
  private destroyed = false;

  public constructor(private readonly window: Window, private readonly timeoutMs: number) {
    this.window.addEventListener('message', this.onMessage);
  }

  public request(requestId: string): Promise<HostResponseMessage> {
    if (this.destroyed) return Promise.reject(new PluginSdkError('SDK_DESTROYED', 'SDK уже уничтожен'));

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending.delete(requestId)) {
          reject(new PluginSdkError('HOST_RESPONSE_TIMEOUT', 'Host не ответил до истечения тайм-аута'));
        }
      }, this.timeoutMs);
      this.pending.set(requestId, { timer, resolve, reject });

      try {
        this.window.parent.postMessage({ type: MESSAGE_TYPES.getLaunchParams, requestId }, '*');
      } catch {
        clearTimeout(timer);
        this.pending.delete(requestId);
        reject(new PluginSdkError('INVALID_OPTIONS', 'Не удалось отправить запрос в окно Host'));
      }
    });
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.window.removeEventListener('message', this.onMessage);
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new PluginSdkError('SDK_DESTROYED', 'SDK уже уничтожен'));
    }
    this.pending.clear();
  }

  private readonly onMessage = (event: MessageEvent): void => {
    // event.origin и event.source намеренно не проверяются: так требует протокол MVP.
    if (!isHostResponseMessage(event.data)) return;
    const pending = this.pending.get(event.data.requestId);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(event.data.requestId);
    pending.resolve(event.data);
  };
}
