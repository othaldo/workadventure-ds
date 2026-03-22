import {Area} from '@workadventure/iframe-api-typings/iframe_api.js';

const BUNDLE_BASE = (() => {
  try {
    const u = (import.meta as any).url as string | undefined;
    if (!u) return '';
    return u.replace(/\/(assets|src)\/.*$/, '/');
  } catch {
    return '';
  }
})();

export function assetUrl(path: string): string {
  return BUNDLE_BASE + path;
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface PositionLike {
  x: number|undefined;
  y: number|undefined;
}

interface ActionSettingsLike {
  teleportModeEnabled: boolean;
  moveSpeed: number;
}

export function clearLastPositionInState<K extends string|number>(
    positions: Record<K, PositionLike>, positionType: K) {
  Object.assign(positions[positionType], {x: undefined, y: undefined});
}

export function setTeleportModeEnabledInState(
    actionSettings: ActionSettingsLike, enabled: boolean): boolean {
  if (actionSettings.teleportModeEnabled === enabled) {
    return false;
  }

  actionSettings.teleportModeEnabled = enabled;
  return true;
}

export function setMoveSpeedInState(
    actionSettings: ActionSettingsLike, speed: number,
    defaultMoveSpeed: number): boolean {
  const nextSpeed = sanitizeMoveSpeed(speed, defaultMoveSpeed);
  if (actionSettings.moveSpeed === nextSpeed) {
    return false;
  }

  actionSettings.moveSpeed = nextSpeed;
  return true;
}

export function setActionVisibilityInState<K extends string>(
    actionVisibility: Record<K, boolean>, buttonId: K,
    enabled: boolean): boolean {
  if (actionVisibility[buttonId] === enabled) {
    return false;
  }

  actionVisibility[buttonId] = enabled;
  return true;
}

export function addTravelActionButton(
    id: string, imageSrc: string, toolTip: string,
    callback: () => Promise<void>| void) {
  WA.ui.actionBar.addButton({
    id,
    imageSrc,
    toolTip,
    callback,
  });
}

export function sanitizeMoveSpeed(
    speed: number, defaultMoveSpeed: number): number {
  if (!Number.isFinite(speed)) {
    return defaultMoveSpeed;
  }

  return Math.min(60, Math.max(5, Math.round(speed)));
}

export function buildTravelToolTip(
    baseToolTip: string, teleportModeEnabled: boolean,
    moveSpeed: number): string {
  if (!teleportModeEnabled) {
    return `${baseToolTip} (Alt+T: Teleport-Modus, Speed: ${moveSpeed})`;
  }

  return `${baseToolTip} (Teleport aktiv, Alt+T, Speed: ${moveSpeed})`;
}

export function getDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function getAreaMidPoint(area: Area) {
  return {x: area.x + area.width / 2, y: area.y + area.height / 2};
}

export function getNearestArea(
    areas: Array<Area|undefined>,
    position: {x: number, y: number}|undefined): Area|undefined {
  const availableAreas =
      areas.filter((area): area is Area => area !== undefined);

  if (availableAreas.length === 0) {
    return undefined;
  }

  if (!position) {
    return availableAreas[0];
  }

  let nearestArea = availableAreas[0];
  let shortestDistance = Number.POSITIVE_INFINITY;

  for (const area of availableAreas) {
    const midPoint = getAreaMidPoint(area);
    const distance =
        getDistance(position.x, position.y, midPoint.x, midPoint.y);

    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestArea = area;
    }
  }

  return nearestArea;
}

export async function getNearestAreaByName(areaNames: string[]):
    Promise<Area|undefined> {
  const areas = await Promise.all(
      areaNames.map((areaName) => WA.room.area.get(areaName)));
  const position = await WA.player.getPosition();

  return getNearestArea(areas, position ?? undefined);
}
