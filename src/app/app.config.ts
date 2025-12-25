import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

registerLocaleData(localeEn);

/**
 * Application configuration object
 * Configures Angular providers including routing, Firebase services, and locale settings
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'en-US' },
    provideFirebaseApp(() =>
      initializeApp({
        apiKey: 'AIzaSyAeUfU1CmvbrTSoV42n_yRBeiTxNM6G5I8',
        authDomain: 'join-ba863.firebaseapp.com',
        projectId: 'join-ba863',
        storageBucket: 'join-ba863.firebasestorage.app',
        messagingSenderId: '396625337156',
        appId: '1:396625337156:web:188283b04bd0a98c585511',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
};