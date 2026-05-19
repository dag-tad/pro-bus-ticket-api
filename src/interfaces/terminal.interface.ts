export interface ITerminal {
  id: string;
  name: string;
  city: string;
  subCity?: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  contactPerson?: string;
  phoneNumber?: string;
}