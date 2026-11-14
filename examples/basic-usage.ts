import { init, PluginSdkError, type LaunchParams } from '@dwspurpleteam/plugin-frontend-sdk';

const sdk = init({ timeoutMs: 5_000 });

async function startPlugin(): Promise<void> {
  try {
    const params: LaunchParams = await sdk.getLaunchParams();

    // LaunchParams — контекст отображения Plugin UI, а не данные для авторизации.
    document.querySelector<HTMLElement>('[data-call-name]')!.textContent = params.call.name;
    document.querySelector<HTMLElement>('[data-user-name]')!.textContent = params.user.displayName;

    console.log('Идентификатор звонка:', params.call.id);
    console.log('Идентификатор участия:', params.session.id);
  } catch (error) {
    if (error instanceof PluginSdkError) {
      console.error(`Не удалось получить контекст запуска: ${error.code}`, error);
      return;
    }

    throw error;
  }
}

void startPlugin();

// В SPA вызовите destroy при размонтировании корневого компонента Plugin UI.
window.addEventListener('pagehide', () => sdk.destroy(), { once: true });
