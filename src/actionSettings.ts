import {assetUrl} from './actions.helpers.js';

export interface ActionSettings {
  teleportModeEnabled: boolean;
  moveSpeed: number;
}

let settingsMenuRegistered = false;

export function registerActionSettingsMenu() {
  if (settingsMenuRegistered) {
    return;
  }

  WA.ui.registerMenuCommand('Aktionen-Einstellungen', {
    iframe: assetUrl('ds/action-settings.html'),
    allowApi: true,
  });

  settingsMenuRegistered = true;
}
