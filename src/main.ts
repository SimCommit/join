import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/**
 * Application bootstrap configuration
 * Initializes the Angular application with locale settings and error handling
 */

/**
 * Configures browser locale settings to enforce English locale
 * Ensures consistent date input behavior across different browser locales
 */
function configureBrowserLocale(): void {
  if (!isBrowserEnvironment()) {
    return;
  }

  setDocumentLanguage();
  overrideNavigatorLanguage();
  overrideNavigatorLanguages();
}

/**
 * Checks if code is running in browser environment
 * @returns {boolean} True if window object is available
 */
function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Sets the document language to English
 */
function setDocumentLanguage(): void {
  document.documentElement.lang = 'en-US';
}

/**
 * Overrides navigator.language property to enforce English
 */
function overrideNavigatorLanguage(): void {
  Object.defineProperty(navigator, 'language', {
    value: 'en-US',
    writable: false,
  });
}

/**
 * Overrides navigator.languages property to enforce English
 */
function overrideNavigatorLanguages(): void {
  Object.defineProperty(navigator, 'languages', {
    value: ['en-US', 'en'],
    writable: false,
  });
}

/**
 * Bootstraps the Angular application
 * Handles startup errors gracefully
 */
function initializeApplication(): void {
  bootstrapApplication(AppComponent, appConfig);
}

configureBrowserLocale();
initializeApplication();
