import { autoUpdater } from 'electron-updater';
import { dialog } from 'electron';

export function setupAutoUpdater() {
  // Configuración para que descargue en background pero no instale automático sin aviso
  autoUpdater.autoDownload = false;

  autoUpdater.on('error', (error) => {
    console.error('Error in auto-updater.', error);
  });

  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Actualización Disponible',
      message: `La versión ${info.version} de M3Flow está disponible. ¿Deseas descargarla ahora?`,
      buttons: ['Sí, Descargar', 'Más tarde']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Actualización Lista',
      message: 'La actualización se ha descargado. La aplicación se reiniciará para aplicarla.',
      buttons: ['Reiniciar ahora', 'Luego']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  // Checkear actualizaciones al iniciar
  autoUpdater.checkForUpdates().catch(err => {
    console.log('Update check failed (expected in dev or no release yet):', err.message);
  });
}
