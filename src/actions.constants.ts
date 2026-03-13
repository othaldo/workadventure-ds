export const ActionButtonId = {
  Pause: 'pause-btn',
  CustomerCall: 'customer-call-btn',
  Meeting: 'meeting-btn',
} as const;

export const AreaName = {
  Pause1: 'pauseArea',
  Pause2: 'pauseArea2',
  CustomerCall1: 'ccArea1',
  CustomerCall2: 'ccArea2',
  Pool: 'poolArea',
  Meeting: 'meetingArea',
} as const;

export const PauseAreaNames = [AreaName.Pause1, AreaName.Pause2] as const;
export const CustomerCallAreaNames =
    [AreaName.CustomerCall1, AreaName.CustomerCall2] as const;
