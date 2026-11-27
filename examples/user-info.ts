import { init, PluginSdkError } from '@dwspurpleteam/plugin-frontend-sdk';

const sdk = init();

async function showCurrentUser(): Promise<void> {
  try {
    const { user } = await sdk.getLaunchParams();

    document.querySelector<HTMLElement>('[data-user-id]')!.textContent = user.id;
    document.querySelector<HTMLElement>('[data-user-name]')!.textContent = user.displayName;
    document.querySelector<HTMLElement>('[data-user-role]')!.textContent = user.isGuest
      ? 'Гость'
      : 'Авторизованный пользователь';

    const photo = document.querySelector<HTMLImageElement>('[data-user-photo]');
    if (photo) {
      if (user.photoUrl) {
        photo.src = user.photoUrl;
        photo.alt = `Фотография ${user.displayName}`;
        photo.hidden = false;
      } else {
        photo.hidden = true;
      }
    }
  } catch (error) {
    if (error instanceof PluginSdkError) {
      console.error(`Контекст пользователя недоступен: ${error.code}`, error);
      return;
    }

    throw error;
  }
}

void showCurrentUser();
window.addEventListener('pagehide', () => sdk.destroy(), { once: true });
