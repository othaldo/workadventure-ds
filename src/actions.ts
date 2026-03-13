import {Area} from '@workadventure/iframe-api-typings/iframe_api.js';

import {ActionButtonId, AreaName, CustomerCallAreaNames, PauseAreaNames,} from './actions.constants.js';
import {assetUrl, getNearestAreaByName, getRandomInt} from './actions.helpers.js';

const tileSize = 32;

enum PositionType {
  LastPositionBreak,
  LastPositionCall,
  LastPositionMeeting,
}

interface Position {
  x: number|undefined;
  y: number|undefined;
}

const positions: Record<PositionType, Position> = {
  [PositionType.LastPositionBreak]: {x: undefined, y: undefined},
  [PositionType.LastPositionCall]: {x: undefined, y: undefined},
  [PositionType.LastPositionMeeting]: {x: undefined, y: undefined},
};

function clearLastPosition(positionType: PositionType) {
  Object.assign(positions[positionType], {x: undefined, y: undefined});
}

function registerAreaOnLeaveHandler() {
  for (const areaName of PauseAreaNames) {
    WA.room.area.onLeave(areaName).subscribe(() => {
      clearLastPosition(PositionType.LastPositionBreak);
    });
  }

  for (const areaName of CustomerCallAreaNames) {
    WA.room.area.onLeave(areaName).subscribe(() => {
      clearLastPosition(PositionType.LastPositionCall);
    });
  }

  WA.room.area.onLeave(AreaName.Meeting).subscribe(() => {
    clearLastPosition(PositionType.LastPositionMeeting);
  });
}

function addWalkButton(
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

      await walkPlayerToArea(area, positionType);
    }
  });
}

async function walkPlayerToArea(
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
    // Prevent joining proximity/livekit calls while auto-walking through call
    // areas. This is restored in finally, including on cancel/error.
    WA.controls.disablePlayerProximityMeeting();

    let moveResult;
    try {
      moveResult = await WA.player.moveTo(x, y, 20);
    } finally {
      WA.controls.restorePlayerProximityMeeting();
    }

    // Fallback: if movement is interrupted, area leave events may not run as
    // expected.
    if (moveResult?.cancelled && area === undefined) {
      clearLastPosition(positionType);
    }
  }

  removeButtons();
  addActionButtons();
}

function addPauseButton() {
  addWalkButton(
      ActionButtonId.Pause, assetUrl('ds/pause.png'),
      'Zum Pausenbereich teleportieren und zurück',
      PositionType.LastPositionBreak,
      async () => await getNearestAreaByName([...PauseAreaNames]));
}

function addCustomerCallButton() {
  addWalkButton(
      ActionButtonId.CustomerCall, assetUrl('ds/call.png'),
      'Zum \'Im Gespräch\'-Bereich teleportieren und zurück',
      PositionType.LastPositionCall,
      async () => await getNearestAreaByName([...CustomerCallAreaNames]));
}

function addMeetingButton() {
  addWalkButton(
      ActionButtonId.Meeting, assetUrl('ds/meeting.png'),
      'Zum Meeting-Bereich teleportieren und zurück',
      PositionType.LastPositionMeeting,
      async () => await WA.room.area.get(AreaName.Meeting));
}

function addActionButtons() {
  addPauseButton();
  addCustomerCallButton();
  addMeetingButton();
}

function removeButtons() {
  WA.ui.actionBar.removeButton(ActionButtonId.Pause);
  WA.ui.actionBar.removeButton(ActionButtonId.CustomerCall);
  WA.ui.actionBar.removeButton(ActionButtonId.Meeting);
}

export class Actions {
  static registerActions() {
    addActionButtons();
    registerAreaOnLeaveHandler();
  }
}