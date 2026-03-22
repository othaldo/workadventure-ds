import {Area} from '@workadventure/iframe-api-typings/iframe_api.js';

import {ActionButtonId, AreaName, CustomerCallAreaNames, DefaultMoveSpeed, MoveSpeedStateKey, PauseAreaNames, TeleportModeStateKey,} from './actions.constants.js';
import {assetUrl, buildTravelToolTip, getNearestAreaByName, getRandomInt, sanitizeMoveSpeed,} from './actions.helpers.js';
import {registerActionSettingsMenu} from './actionSettings.js';

const tileSize = 32;

const actionSettings = {
  teleportModeEnabled: false,
  moveSpeed: DefaultMoveSpeed,
};

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

function setTeleportModeEnabled(enabled: boolean) {
  if (actionSettings.teleportModeEnabled === enabled) {
    return;
  }

  actionSettings.teleportModeEnabled = enabled;

  removeButtons();
  addActionButtons();
}

function setMoveSpeed(speed: number) {
  const nextSpeed = sanitizeMoveSpeed(speed, DefaultMoveSpeed);
  if (actionSettings.moveSpeed === nextSpeed) {
    return;
  }

  actionSettings.moveSpeed = nextSpeed;

  removeButtons();
  addActionButtons();
}

function loadActionSettingsFromState() {
  const savedTeleport = WA.player.state.loadVariable(TeleportModeStateKey);
  if (typeof savedTeleport === 'boolean') {
    setTeleportModeEnabled(savedTeleport);
  }

  const savedMoveSpeed = WA.player.state.loadVariable(MoveSpeedStateKey);
  if (typeof savedMoveSpeed === 'number') {
    setMoveSpeed(savedMoveSpeed);
  }
}

function registerActionSettingsStateSync() {
  WA.player.state.onVariableChange(TeleportModeStateKey).subscribe((value) => {
    if (typeof value === 'boolean') {
      setTeleportModeEnabled(value);
    }
  });

  WA.player.state.onVariableChange(MoveSpeedStateKey).subscribe((value) => {
    if (typeof value === 'number') {
      setMoveSpeed(value);
    }
  });
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

function addTravelButton(
    id: string, imageSrc: string, toolTip: string, positionType: PositionType,
    getArea: () => Promise<Area|undefined>) {
  WA.ui.actionBar.addButton({
    id,
    imageSrc,
    toolTip: buildTravelToolTip(
        toolTip, actionSettings.teleportModeEnabled, actionSettings.moveSpeed),
    callback: async () => {
      const position = positions[positionType];
      const useTeleport = actionSettings.teleportModeEnabled;
      let area;

      if (useTeleport || position.x === undefined || position.y === undefined) {
        area = await getArea();
      }

      await travelPlayerToArea(area, positionType, useTeleport);
    }
  });
}

async function travelPlayerToArea(
    area: Area|undefined, positionType: PositionType, useTeleport: boolean) {
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
    if (useTeleport) {
      await WA.player.teleport(x, y);
    } else {
      let moveResult = await WA.player.moveTo(x, y, actionSettings.moveSpeed);

      // Fallback: if movement is interrupted, area leave events may not run as
      // expected.
      if (moveResult?.cancelled && area === undefined) {
        clearLastPosition(positionType);
      }
    }
  }

  removeButtons();
  addActionButtons();
}

function addPauseButton() {
  addTravelButton(
      ActionButtonId.Pause, assetUrl('ds/pause.png'),
      'Zum Pausenbereich teleportieren und zurück',
      PositionType.LastPositionBreak,
      async () => await getNearestAreaByName([...PauseAreaNames]));
}

function addCustomerCallButton() {
  addTravelButton(
      ActionButtonId.CustomerCall, assetUrl('ds/call.png'),
      'Zum \'Im Gespräch\'-Bereich teleportieren und zurück',
      PositionType.LastPositionCall,
      async () => await getNearestAreaByName([...CustomerCallAreaNames]));
}

function addMeetingButton() {
  addTravelButton(
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
    loadActionSettingsFromState();
    registerActionSettingsStateSync();
    registerActionSettingsMenu();
    addActionButtons();
    registerAreaOnLeaveHandler();
  }
}