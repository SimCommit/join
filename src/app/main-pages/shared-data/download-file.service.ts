import { Injectable } from '@angular/core';

/**
 * Provides logic for downloading files that are represented as Base64 strings.
 * Contains one public method for converting Base64 to a Blob and triggering a browser download.
 */
@Injectable({
  providedIn: 'root',
})
export class DownloadFileService {
  constructor() {}

  /**
   * Converts a Base64 string to a file and triggers a download in the browser.
   * @param {string} base64String Base64 data, with or without a data URL prefix.
   * @param {string} mimeType MIME type of the target file.
   * @param {string} fileName Desired name of the downloaded file.
   * @returns {void}
   */
  base64ToFile(base64String: string, mimeType: string, fileName: string): void {
    const base64Data = base64String.replace(/^data:.+;base64,/, '');
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  }
}
