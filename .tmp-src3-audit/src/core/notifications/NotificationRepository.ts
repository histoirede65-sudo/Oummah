export interface NotificationRequest {
  id: string;
  title: string;
  body: string;
  scheduledAt: Date;
  data?: Readonly<Record<string, string | number>>;
}

export interface NotificationRepository {
  requestPermission(): Promise<boolean>;
  schedule(request: NotificationRequest): Promise<void>;
  cancel(id: string): Promise<void>;
}
