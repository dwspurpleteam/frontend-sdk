export class FakeWindow extends EventTarget {
  public parent: { postMessage(message: unknown, targetOrigin: string): void } = this;
  public readonly sent: Array<{ message: unknown; targetOrigin: string }> = [];

  public postMessage(message: unknown, targetOrigin: string): void {
    this.sent.push({ message, targetOrigin });
  }

  public respond(data: unknown, origin = 'https://host.example'): void {
    this.dispatchEvent(new MessageEvent('message', { data, origin }));
  }
}

export const validParams = {
  call: { id: 'call-1', name: 'Weekly sync' },
  user: { id: 'user-1', displayName: 'Ada', isGuest: false },
  session: { id: 'session-1' },
};

export function requestId(window: FakeWindow, index = 0): string {
  return (window.sent[index].message as { requestId: string }).requestId;
}
