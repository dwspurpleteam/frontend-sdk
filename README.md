# Frontend Plugin SDK

TypeScript SDK для Plugin UI, загруженного внутри iframe. SDK получает контекст запуска из Host Frontend через `window.postMessage` и не выполняет backend-запрос при открытии плагина.

`LaunchParams` — это UI-контекст, а **не** доказательство личности или авторизации. В MVP намеренно не выполняется проверка `event.origin` и `event.source`, используется `'*'` как `targetOrigin`; JWT, подписи, ключи, повторы запросов и backend-авторизация отсутствуют.

## API

```ts
import { init, type LaunchParams } from '@dwspurpleteam/plugin-frontend-sdk';

const sdk = init({ timeoutMs: 5_000 });
try {
  const params: LaunchParams = await sdk.getLaunchParams();
  console.log(params.call.id, params.user.displayName);
} finally {
  sdk.destroy();
}
```

`init({ window })` позволяет передать тестовый объект Window. `getLaunchParams()` должен вызываться внутри iframe. `destroy()` удаляет обработчик сообщений и отклоняет незавершённые запросы.

Полный минимальный пример Plugin UI находится в [examples/basic-usage.ts](examples/basic-usage.ts). Пример вывода информации о текущем пользователе — в [examples/user-info.ts](examples/user-info.ts).

```ts
interface LaunchParams {
  call: { id: string; name: string };
  user: { id: string; displayName: string; photoUrl?: string; isGuest: boolean };
  session: { id: string };
}
```

Объект `room` намеренно отсутствует: `call.id` — идентификатор звонка и имя комнаты LiveKit.

## Протокол postMessage

Каждый вызов `getLaunchParams()` создаёт requestId и отправляет в `window.parent` следующее сообщение с `targetOrigin: '*'`:

```ts
{ type: 'PluginGetLaunchParams', requestId }
```

Host отвечает с тем же requestId:

```ts
{ type: 'PluginGetLaunchParamsResult', requestId, data: launchParams }
// или
{ type: 'PluginGetLaunchParamsError', requestId,
  error: { code: 'LAUNCH_CONTEXT_NOT_READY' | 'INVALID_REQUEST', message: string } }
```

Неизвестные, некорректные сообщения и сообщения с чужим requestId игнорируются. Успешный payload проверяется во время выполнения: обязательные идентификаторы и имена — непустые строки, `isGuest` — boolean, а переданный `photoUrl` — непустая строка.

## Ошибки

`PluginSdkError` содержит `code`: `INVALID_OPTIONS`, `HOST_RESPONSE_TIMEOUT`, `HOST_ERROR`, `INVALID_RESPONSE` или `SDK_DESTROYED`. Для ошибки Host также сохраняются `hostCode` и `hostMessage`. Тайм-аут по умолчанию — 5000 мс; `timeoutMs` должен быть конечным положительным числом.

## Требования к Host Frontend и платформе

Этот пакет реализует только сторону Plugin UI. Host Frontend должен хранить контекст текущего звонка, отвечать на каждый запрос с тем же requestId, возвращать `LAUNCH_CONTEXT_NOT_READY`, если контекст ещё недоступен, и очищать его при выходе из звонка. В MVP ответы должны отправляться с `targetOrigin: '*'`.

Backend платформы должен сформировать данные до подключения к LiveKit: `call.id === room.name`, а `session.id === participant.identity`. Интеграция Host/Backend/LiveKit является внешней зависимостью SDK и здесь не реализуется.

## Разработка

```sh
npm install
npm test
```
