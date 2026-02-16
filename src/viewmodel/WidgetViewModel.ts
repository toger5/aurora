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
  rawUrl: string;
  room: RoomInterface;
  // onMessageForWidget: (message: string) => void;
}

export class WidgetViewModel
  extends BaseViewModel<WidgetViewSnapshot, Props>
  implements WidgetViewActions
{
  private running = false;
  private driver: WidgetDriverInterface;
  private handle: WidgetDriverHandleInterface;
  private room: RoomInterface;
  private iFrameListener: ((msg: string) => void) | null = null;
  private widgetSettings: WidgetSettings;
  private capabilityProvider: WidgetCapabilitiesProvider = {
    //securite securite securite this is wrong i will spell and repeat wrong whiskey romeo oscar golf
    acquireCapabilities: (capabilities: WidgetCapabilities) => capabilities,
  };

  public constructor(props: Props) {
    super(props, { url: null });

    this.widgetSettings = {
      widgetId: props.widgetId,
      initAfterContentLoad: props.initAfterContentLoad,
      rawUrl: props.rawUrl,
    };

    const { driver, handle } = makeWidgetDriver(this.widgetSettings);
    this.driver = driver;
    this.handle = handle;
    this.room = props.room;

    this.run();
  }

  async sendMsgToDriver(msg: string): Promise<void> {
    await this.handle.send(msg);
  }

  setIFrameMessageForwarder(listener: ((msg: string) => void) | null) {
    this.iFrameListener = listener;
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

  private run = (): void => {
    if (this.running) return;

    generateWebviewUrl(this.widgetSettings, this.room, {
      clientId: "aurora-widget-container",
      languageTag: "undefined",
      theme: undefined,
    }).then((url) => {
      // add parent raw

      try {
        const urlObj = new URL(url);
        urlObj.searchParams.set("parentUrl", encodeURI(window.location.href));
        void this.driver.run(this.room, this.capabilityProvider);
        void this.startReceivingFromDriver();
        this.snapshot.set({ url: urlObj.toString() });
      } catch {}
    });
  };
}
