export interface IDevice {
  deviceId: string;
  deviceName: string;
  deviceToken: string;
  platform: 'ios' | 'android' | 'web';
  lastUsedAt: Date;
}