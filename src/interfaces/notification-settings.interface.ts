export interface NotificationSettings {
  email: {
    bookingConfirmation: boolean;
    bookingReminders: boolean;
    promotions: boolean;
    paymentReceipts: boolean;
  };
  sms: {
    bookingConfirmation: boolean;
    boardingReminders: boolean;
    paymentAlerts: boolean;
    ratingPrompts: boolean;
  };
  push: {
    bookingUpdates: boolean;
    departureReminders: boolean;
    promotions: boolean;
  };
}