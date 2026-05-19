export interface ICompanySettings {
  autoConfirmBookings: boolean;
  allowProxyBooking: boolean;
  maxSeatsPerBooking: number;
  cancellationWindowHours: number;
  dynamicPricing: boolean;
  notifications: {
    email: boolean;
    sms: boolean;
  };
}