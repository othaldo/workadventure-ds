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
