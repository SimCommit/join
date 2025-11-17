import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DownloadFileService {
  

  constructor() {}

  base64ToFile(base64String: string, mimeType: string, fileName: string) {
    // Remove data URL scheme if present
    const base64Data = base64String.replace(/^data:.+;base64,/, '');
    const byteCharacters = atob(base64Data); // Decode Base64 string
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const url = URL.createObjectURL(blob);

    // Create a link element to download the file
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();

    // Cleanup
    URL.revokeObjectURL(url);
  }
}
