import {Area} from '@workadventure/iframe-api-typings/iframe_api.js';

import {ActionButtonId, AreaName, CustomerCallAreaNames, PauseAreaNames, TeleportResetAreaNames,} from './actions.constants.js';
import {assetUrl, getNearestAreaByName, getRandomInt} from './actions.helpers.js';

const tileSize = 32;

enum PositionType {
  LastPositionBreak,
  LastPositionCall,
  LastPositionPool,
}

interface Position {
  x: number|undefined;
  y: number|undefined;
}

const positions: Record<PositionType, Position> = {
  [PositionType.LastPositionBreak]: {x: undefined, y: undefined},
  [PositionType.LastPositionCall]: {x: undefined, y: undefined},
  [PositionType.LastPositionPool]: {x: undefined, y: undefined},
};

function clearLastPositions() {
  for (let position of Object.values(positions)) {
    position.x = undefined;
    position.y = undefined;
  }
}

function registerAreaOnLeaveHandler() {
  for (const areaName of TeleportResetAreaNames) {
    WA.room.area.onLeave(areaName).subscribe(() => {
      clearLastPositions();
    });
  }
}

function addTeleportButton(
    id: string, imageSrc: string, toolTip: string, positionType: PositionType,
    getArea: () => Promise<Area|undefined>) {
  WA.ui.actionBar.addButton({
    id,
    imageSrc,
    toolTip,
    callback: async () => {
      const position = positions[positionType];
      let area;

      if (position.x === undefined || position.y === undefined) {
        area = await getArea();
      }

      teleportPlayerToArea(area, positionType);
    }
  });
}

async function teleportPlayerToArea(
    area: Area|undefined, positionType: PositionType) {
  let x = positions[positionType].x;
  let y = positions[positionType].y;

  if (area !== undefined) {
    const xStart = area.x;
    const xEnd = area.x + area.width - (tileSize / 2);

    const yStart = area.y;
    const yEnd = area.y + area.height - (tileSize / 2);

    x = getRandomInt(xStart, xEnd);
    y = getRandomInt(yStart, yEnd);

    const position = await WA.player.getPosition();
    if (position) {
      Object.assign(positions[positionType], position);
    }
  } else {
    Object.assign(positions[positionType], {x: undefined, y: undefined});
  }

  if (x !== undefined && y !== undefined) {
    WA.player.teleport(x, y);
  }

  removeButtons();
  addActionButtons();
}

function addPauseButton() {
  addTeleportButton(
      ActionButtonId.Pause, assetUrl('ds/pause.png'),
      'Zum Pausenbereich teleportieren und zurück',
      PositionType.LastPositionBreak,
      async () => await getNearestAreaByName([...PauseAreaNames]));
}

function addCustomerCallButton() {
  addTeleportButton(
      ActionButtonId.CustomerCall, assetUrl('ds/call.png'),
      'Zum \'Im Gespräch\'-Bereich teleportieren und zurück',
      PositionType.LastPositionCall,
      async () => await getNearestAreaByName([...CustomerCallAreaNames]));
}

function addPoolButton() {
  addTeleportButton(
      ActionButtonId.Pool, assetUrl('ds/pool.png'),
      'Zum Pool-Bereich teleportieren und zurück',
      PositionType.LastPositionPool,
      async () => await WA.room.area.get(AreaName.Pool));
}

function addActionButtons() {
  addPauseButton();
  addCustomerCallButton();
  addPoolButton();
}

function removeButtons() {
  WA.ui.actionBar.removeButton(ActionButtonId.Pause);
  WA.ui.actionBar.removeButton(ActionButtonId.CustomerCall);
  WA.ui.actionBar.removeButton(ActionButtonId.Pool);
}

export class Actions {
  static registerActions() {
    addActionButtons();
    registerAreaOnLeaveHandler();
  }
}