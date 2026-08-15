import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';

import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';

import { provideRouter } from '@angular/router';

import {
  ConfirmationService,
  MessageService,
} from 'primeng/api';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideZoneChangeDetection({
      eventCoalescing: true,
    }),

    provideRouter(routes),

    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor,
      ]),
    ),

    ConfirmationService,
    MessageService,

    providePrimeNG({
      license: 'eyJpZCI6IjE4NmVjOTgwLTU2ZDUtNDZlMC05YjI4LTYxZmViNDdkNTAyZSIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODY1NzQ4NjgsImV4cCI6MTgxODExMDg2OH0.mI1jZn4qUGHP2ZSMI9mFjkaID1ut64yXNCFS3jdkEiUFPqqozxNx_7qSP1f8fzSLF6i7xZ7LFiOfIrlSAEgODQ',

      ripple: true,

      theme: {
        preset: Aura,

        options: {
          darkModeSelector: '.app-dark',

          cssLayer: {
            name: 'primeng',
            order:
              'theme, base, primeng, components, utilities',
          },
        },
      },

      overlayOptions: {
        mode: 'overlay',
      },
    }),
  ],
};