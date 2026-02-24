/*
 *
 *  * Copyright 2025 New Vector Ltd.
 *  *
 *  * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 *  * Please see LICENSE files in the repository root for full details.
 *
 */

import { BaseViewModel } from "@element-hq/web-shared-components";
import {
  generateWebviewUrl,
  makeWidgetDriver,
  RoomInterface,
  WidgetCapabilities,
  WidgetCapabilitiesProvider,
  WidgetDriverHandleInterface,
  WidgetDriverInterface,
  WidgetSettings,
} from "../generated/matrix_sdk_ffi.ts";
import { WidgetViewActions, WidgetViewSnapshot } from "./widget-view.types.ts";

interface Props {
  widgetId: string;
  initAfterContentLoad: boolean;
  room: RoomInterface;
}

export class WidgetViewModel
  extends BaseViewModel<WidgetViewSnapshot, Props>
  implements WidgetViewActions
{
  private running = false;
  private driver: WidgetDriverInterface | undefined;
  private handle: WidgetDriverHandleInterface | undefined;
  private room: RoomInterface;
  private iFrameListener: ((msg: string) => void) | null = null;
  private initAfterContentLoad = false;
  private widgetUrl: string | undefined;
  private widgetId: string | undefined;
  private capabilityProvider: WidgetCapabilitiesProvider = {
    //securite securite securite this is wrong i will spell and repeat wrong whiskey romeo oscar golf
    acquireCapabilities: (capabilities: WidgetCapabilities) => capabilities,
  };

  public constructor(props: Props) {
    super(props, { url: null });
    this.initAfterContentLoad = props.initAfterContentLoad;
    this.widgetId = props.widgetId;
    this.room = props.room;
  }

  async sendMsgToDriver(msg: string): Promise<void> {
    if (this.handle) {
      await this.handle.send(msg);
    } else {
      console.error(
        "Widget handle not initialized could not send message: ",
        msg,
      );
    }
  }

  setIFrameMessageForwarder(listener: ((msg: string) => void) | null) {
    this.iFrameListener = listener;
  }

  setWidgetUrl(url: string) {
    this.widgetUrl = url;
  }

  private async startReceivingFromDriver() {
    let next: null | undefined | string = null;
    for (
      let next = await this.handle.recv();
      next !== undefined;
      next = await this.handle.recv()
    ) {
      this.iFrameListener?.(next);
    }
  }

  public run = (): void => {
    if (this.running) return;

    if (!this.widgetId || !this.widgetUrl) {
      console.error("Widget id or url not set");
      return;
    }

    const widgetSettings = {
      widgetId: this.widgetId,
      initAfterContentLoad: this.initAfterContentLoad!,
      rawUrl: this.widgetUrl,
    };
    console.log("make driver with", widgetSettings);
    const { driver, handle } = makeWidgetDriver(widgetSettings);
    this.driver = driver;
    this.handle = handle;

    console.log("originalUrl", widgetSettings.rawUrl);
    generateWebviewUrl(widgetSettings, this.room, {
      clientId: "aurora-widget-container",
      languageTag: "undefined",
      theme: undefined,
    }).then((url) => {
      // add parent raw
      console.log("originalUrl", widgetSettings.rawUrl);
      try {
        const urlObj = new URL(url);
        urlObj.searchParams.set("parentUrl", encodeURI(window.location.origin));
        this.snapshot.set({ url: urlObj.toString() });
        setTimeout(() => {
          void driver!.run(this.room, this.capabilityProvider);
          void this.startReceivingFromDriver();
        }, 1000);
      } catch {}
    });
  };
}
