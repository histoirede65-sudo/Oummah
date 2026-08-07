export type SupportAttachment = {
  id: string;
  ticketId: string;
  fileName: string;
  contentType: string;
  storagePath: string;
  createdAt: string;
};

export type SupportDiagnostic = {
  appVersion: string;
  platform: string;
  osVersion: string;
  deviceModel: string;
  screenName?: string;
  capturedAt: string;
};
