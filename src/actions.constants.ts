export const ActionButtonId = {
  Pause: 'pause-btn',
  CustomerCall: 'customer-call-btn',
  Pool: 'pool-btn',
} as const;

export const AreaName = {
  Pause1: 'pauseArea',
  Pause2: 'pauseArea2',
  CustomerCall1: 'ccArea1',
  CustomerCall2: 'ccArea2',
  Pool: 'poolArea',
} as const;

export const PauseAreaNames = [AreaName.Pause1, AreaName.Pause2] as const;
export const CustomerCallAreaNames =
    [AreaName.CustomerCall1, AreaName.CustomerCall2] as const;
export const TeleportResetAreaNames =
    [...PauseAreaNames, ...CustomerCallAreaNames, AreaName.Pool] as const;
