import {Area} from '@workadventure/iframe-api-typings/iframe_api.js';

import {ActionButtonId, ActionVisibilityStateKey, AreaName, CustomerCallAreaNames, DefaultMoveSpeed, MoveSpeedStateKey, PauseAreaNames, TeleportModeStateKey,} from './actions.constants.js';
import {addTravelActionButton, assetUrl, buildTravelToolTip, clearLastPositionInState, getNearestAreaByName, getRandomInt, setActionVisibilityInState, setMoveSpeedInState, setTeleportModeEnabledInState,} from './actions.helpers.js';
import {registerActionSettingsMenu} from './actionSettings.js';

const tileSize = 32;

const actionSettings = {
  teleportModeEnabled: false,
  moveSpeed: DefaultMoveSpeed,
};

const actionVisibility = {
  [ActionButtonId.Pause]: true,
  [ActionButtonId.CustomerCall]: true,
  [ActionButtonId.Meeting]: true,
  [ActionButtonId.Emergency]: false,
  [ActionButtonId.Greenhouse]: false,
  [ActionButtonId.Lounge]: false,
  [ActionButtonId.Pool]: false,
  [ActionButtonId.ClassRoom]: false,
};

enum PositionType {
  LastPositionBreak,
  LastPositionCall,
  LastPositionMeeting,
  LastPositionEmergency,
  LastPositionGreenhouse,
  LastPositionLounge,
  LastPositionPool,
  LastPositionClassRoom,
}

interface Position {
  x: number|undefined;
  y: number|undefined;
}

const positions: Record<PositionType, Position> = {
  [PositionType.LastPositionBreak]: {x: undefined, y: undefined},
  [PositionType.LastPositionCall]: {x: undefined, y: undefined},
  [PositionType.LastPositionMeeting]: {x: undefined, y: undefined},
  [PositionType.LastPositionEmergency]: {x: undefined, y: undefined},
  [PositionType.LastPositionGreenhouse]: {x: undefined, y: undefined},
  [PositionType.LastPositionLounge]: {x: undefined, y: undefined},
  [PositionType.LastPositionPool]: {x: undefined, y: undefined},
  [PositionType.LastPositionClassRoom]: {x: undefined, y: undefined},
};

function clearLastPosition(positionType: PositionType) {
  clearLastPositionInState(positions, positionType);
}

function setTeleportModeEnabled(enabled: boolean) {
  const changed = setTeleportModeEnabledInState(actionSettings, enabled);
  if (!changed) {
    return;
  }
}

function setMoveSpeed(speed: number) {
  const changed = setMoveSpeedInState(actionSettings, speed, DefaultMoveSpeed);
  if (!changed) {
    return;
  }
}

function setActionVisibility(
    buttonId: keyof typeof actionVisibility, enabled: boolean) {
  const changed =
      setActionVisibilityInState(actionVisibility, buttonId, enabled);
  if (!changed) {
    return;
  }

  if (!enabled) {
    removeActionButton(buttonId);
    return;
  }

  // Rebuild all buttons only when adding one to keep a stable order.
  refreshActionButtons();
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

  const savedPauseVisibility =
      WA.player.state.loadVariable(ActionVisibilityStateKey.Pause);
  if (typeof savedPauseVisibility === 'boolean') {
    setActionVisibility(ActionButtonId.Pause, savedPauseVisibility);
  }

  const savedCustomerCallVisibility =
      WA.player.state.loadVariable(ActionVisibilityStateKey.CustomerCall);
  if (typeof savedCustomerCallVisibility === 'boolean') {
    setActionVisibility(
        ActionButtonId.CustomerCall, savedCustomerCallVisibility);
  }

  const savedMeetingVisibility =
      WA.player.state.loadVariable(ActionVisibilityStateKey.Meeting);
  if (typeof savedMeetingVisibility === 'boolean') {
    setActionVisibility(ActionButtonId.Meeting, savedMeetingVisibility);
  }

  const savedEmergencyVisibility =
      WA.player.state.loadVariable(ActionVisibilityStateKey.Emergency);
  if (typeof savedEmergencyVisibility === 'boolean') {
    setActionVisibility(ActionButtonId.Emergency, savedEmergencyVisibility);
  }

  const savedGreenhouseVisibility =
      WA.player.state.loadVariable(ActionVisibilityStateKey.Greenhouse);
  if (typeof savedGreenhouseVisibility === 'boolean') {
    setActionVisibility(ActionButtonId.Greenhouse, savedGreenhouseVisibility);
  }

  const savedLoungeVisibility =
      WA.player.state.loadVariable(ActionVisibilityStateKey.Lounge);
  if (typeof savedLoungeVisibility === 'boolean') {
    setActionVisibility(ActionButtonId.Lounge, savedLoungeVisibility);
  }

  const savedPoolVisibility =
      WA.player.state.loadVariable(ActionVisibilityStateKey.Pool);
  if (typeof savedPoolVisibility === 'boolean') {
    setActionVisibility(ActionButtonId.Pool, savedPoolVisibility);
  }

  const savedClassRoomVisibility =
      WA.player.state.loadVariable(ActionVisibilityStateKey.ClassRoom);
  if (typeof savedClassRoomVisibility === 'boolean') {
    setActionVisibility(ActionButtonId.ClassRoom, savedClassRoomVisibility);
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

  WA.player.state.onVariableChange(ActionVisibilityStateKey.Pause)
      .subscribe((value) => {
        if (typeof value === 'boolean') {
          setActionVisibility(ActionButtonId.Pause, value);
        }
      });

  WA.player.state.onVariableChange(ActionVisibilityStateKey.CustomerCall)
      .subscribe((value) => {
        if (typeof value === 'boolean') {
          setActionVisibility(ActionButtonId.CustomerCall, value);
        }
      });

  WA.player.state.onVariableChange(ActionVisibilityStateKey.Meeting)
      .subscribe((value) => {
        if (typeof value === 'boolean') {
          setActionVisibility(ActionButtonId.Meeting, value);
        }
      });

  WA.player.state.onVariableChange(ActionVisibilityStateKey.ClassRoom)
      .subscribe((value) => {
        if (typeof value === 'boolean') {
          setActionVisibility(ActionButtonId.ClassRoom, value);
        }
      });

  WA.player.state.onVariableChange(ActionVisibilityStateKey.Emergency)
      .subscribe((value) => {
        if (typeof value === 'boolean') {
          setActionVisibility(ActionButtonId.Emergency, value);
        }
      });

  WA.player.state.onVariableChange(ActionVisibilityStateKey.Greenhouse)
      .subscribe((value) => {
        if (typeof value === 'boolean') {
          setActionVisibility(ActionButtonId.Greenhouse, value);
        }
      });

  WA.player.state.onVariableChange(ActionVisibilityStateKey.Lounge)
      .subscribe((value) => {
        if (typeof value === 'boolean') {
          setActionVisibility(ActionButtonId.Lounge, value);
        }
      });

  WA.player.state.onVariableChange(ActionVisibilityStateKey.Pool)
      .subscribe((value) => {
        if (typeof value === 'boolean') {
          setActionVisibility(ActionButtonId.Pool, value);
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

  WA.room.area.onLeave(AreaName.Emergency).subscribe(() => {
    clearLastPosition(PositionType.LastPositionEmergency);
  });

  WA.room.area.onLeave(AreaName.Greenhouse).subscribe(() => {
    clearLastPosition(PositionType.LastPositionGreenhouse);
  });

  WA.room.area.onLeave(AreaName.Lounge).subscribe(() => {
    clearLastPosition(PositionType.LastPositionLounge);
  });

  WA.room.area.onLeave(AreaName.Pool).subscribe(() => {
    clearLastPosition(PositionType.LastPositionPool);
  });

  WA.room.area.onLeave(AreaName.ClassRoom).subscribe(() => {
    clearLastPosition(PositionType.LastPositionClassRoom);
  });
}

function addTravelButton(
    id: string, imageSrc: string, toolTip: string, positionType: PositionType,
    getArea: () => Promise<Area|undefined>) {
  addTravelActionButton(
      id, imageSrc,
      buildTravelToolTip(
          toolTip, actionSettings.teleportModeEnabled,
          actionSettings.moveSpeed),
      async () => {
        try {
          const position = positions[positionType];
          const useTeleport = actionSettings.teleportModeEnabled;
          let area;
          const hasReturnPosition =
              position.x !== undefined && position.y !== undefined;

          // Resolve the target area only when we are not already able to
          // return.
          if (!hasReturnPosition) {
            area = await getArea();
          }

          await travelPlayerToArea(area, positionType, useTeleport);
        } finally {
          refreshActionButtons();
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
}

function addActionButtons() {
  if (actionVisibility[ActionButtonId.Pause]) {
    addTravelButton(
        ActionButtonId.Pause, assetUrl('ds/pause.png'),
        'Zum Pausenbereich teleportieren und zurück',
        PositionType.LastPositionBreak,
        async () => await getNearestAreaByName([...PauseAreaNames]));
  }

  if (actionVisibility[ActionButtonId.CustomerCall]) {
    addTravelButton(
        ActionButtonId.CustomerCall, assetUrl('ds/call.png'),
        'Zum \'Im Gespräch\'-Bereich teleportieren und zurück',
        PositionType.LastPositionCall,
        async () => await getNearestAreaByName([...CustomerCallAreaNames]));
  }

  if (actionVisibility[ActionButtonId.Meeting]) {
    addTravelButton(
        ActionButtonId.Meeting, assetUrl('ds/meeting.png'),
        'Zum Meeting-Bereich teleportieren und zurück',
        PositionType.LastPositionMeeting,
        async () => await WA.room.area.get(AreaName.Meeting));
  }

  if (actionVisibility[ActionButtonId.Emergency]) {
    addTravelButton(
        ActionButtonId.Emergency, assetUrl('ds/emergency.png'),
        'Zum Emergency-Bereich teleportieren und zurück',
        PositionType.LastPositionEmergency,
        async () => await WA.room.area.get(AreaName.Emergency));
  }

  if (actionVisibility[ActionButtonId.Greenhouse]) {
    addTravelButton(
        ActionButtonId.Greenhouse, assetUrl('ds/greenhouse.png'),
        'Zum Gewächshaus-Bereich teleportieren und zurück',
        PositionType.LastPositionGreenhouse,
        async () => await WA.room.area.get(AreaName.Greenhouse));
  }

  if (actionVisibility[ActionButtonId.Lounge]) {
    addTravelButton(
        ActionButtonId.Lounge, assetUrl('ds/lounge.png'),
        'Zur Lounge teleportieren und zurück', PositionType.LastPositionLounge,
        async () => await WA.room.area.get(AreaName.Lounge));
  }

  if (actionVisibility[ActionButtonId.Pool]) {
    addTravelButton(
        ActionButtonId.Pool, assetUrl('ds/pool.png'),
        'Zum Pool-Bereich teleportieren und zurück',
        PositionType.LastPositionPool,
        async () => await WA.room.area.get(AreaName.Pool));
  }

  if (actionVisibility[ActionButtonId.ClassRoom]) {
    addTravelButton(
        ActionButtonId.ClassRoom, assetUrl('ds/class.png'),
        'Zum Klassenzimmer teleportieren und zurück',
        PositionType.LastPositionClassRoom,
        async () => await WA.room.area.get(AreaName.ClassRoom));
  }
}

function removeActionButton(buttonId: string) {
  WA.ui.actionBar.removeButton(buttonId);
}

function refreshActionButtons() {
  WA.ui.actionBar.removeButton(ActionButtonId.Pause);
  WA.ui.actionBar.removeButton(ActionButtonId.CustomerCall);
  WA.ui.actionBar.removeButton(ActionButtonId.Meeting);
  WA.ui.actionBar.removeButton(ActionButtonId.Emergency);
  WA.ui.actionBar.removeButton(ActionButtonId.Greenhouse);
  WA.ui.actionBar.removeButton(ActionButtonId.Lounge);
  WA.ui.actionBar.removeButton(ActionButtonId.Pool);
  WA.ui.actionBar.removeButton(ActionButtonId.ClassRoom);
  addActionButtons();
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