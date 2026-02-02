export interface MessageEnvelope<T> {
  event: string;
  version: number;
  timestamp: string;
  correlationId?: string;
  payload: T;
}
