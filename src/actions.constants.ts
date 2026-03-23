export const ActionButtonId = {
  Pause: 'pause-btn',
  CustomerCall: 'customer-call-btn',
  Meeting: 'meeting-btn',
  Emergency: 'emergency-btn',
  Greenhouse: 'greenhouse-btn',
  Lounge: 'lounge-btn',
  Pool: 'pool-btn',
} as const;

export const AreaName = {
  Pause1: 'pauseArea',
  Pause2: 'pauseArea2',
  CustomerCall1: 'ccArea1',
  CustomerCall2: 'ccArea2',
  Emergency: 'emergencyArea',
  Greenhouse: 'gewaechshausArea',
  Lounge: 'loungeArea',
  Pool: 'poolArea',
  Meeting: 'meetingArea',
} as const;

export const PauseAreaNames = [AreaName.Pause1, AreaName.Pause2] as const;
export const CustomerCallAreaNames =
    [AreaName.CustomerCall1, AreaName.CustomerCall2] as const;

export const DefaultMoveSpeed = 20;
export const TeleportModeStateKey = 'travelTeleportModeEnabled';
export const MoveSpeedStateKey = 'travelMoveSpeed';

export const ActionVisibilityStateKey = {
  Pause: 'actionVisiblePause',
  CustomerCall: 'actionVisibleCustomerCall',
  Meeting: 'actionVisibleMeeting',
  Emergency: 'actionVisibleEmergency',
  Greenhouse: 'actionVisibleGreenhouse',
  Lounge: 'actionVisibleLounge',
  Pool: 'actionVisiblePool',
} as const;
