export interface WidgetViewSnapshot {
  url: string | null;
}

export interface WidgetViewActions {
  sendMsgToDriver(msg: string): Promise<void>;
  setIFrameMessageForwarder(listener: (msg: string) => void): void;
}
