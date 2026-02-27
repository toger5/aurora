import type React from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useViewModel } from "@element-hq/web-shared-components";
import { WidgetViewModel } from "./viewmodel/WidgetViewModel";
import styles from "./Widget.module.css";

export interface WidgetProps {
  widgetViewModel: WidgetViewModel;
}

export const Widget: React.FC<WidgetProps> = ({ widgetViewModel: vm }) => {
  const ref = useRef<HTMLIFrameElement>(null);
  const snapshot = useViewModel(vm);

  const targetOrigin = useMemo(() => {
    try {
      return new URL(snapshot.url).origin;
    } catch {
      return null;
    }
  }, [snapshot.url]);

  const iFrameMessageForwarder = useCallback(
    (msg: string) => {
      console.log(
        "trying to send message to widget",
        msg,
        "\ntarget: ",
        targetOrigin,
        "\nlocation: ",
        ref.current?.contentWindow?.location,
      );
      try {
        const jsonMsg = JSON.parse(msg);
        ref.current?.contentWindow?.postMessage(jsonMsg, "*");
      } catch {
        console.error("Failed to parse message:", msg);
      }
    },
    [targetOrigin],
  );

  // Note that there is advice saying allow-scripts shouldn't be used with allow-same-origin
  // because that would allow the iframe to programmatically remove the sandbox attribute, but
  // this would only be for content hosted on the same origin as the element client: anything
  // hosted on the same origin as the client will get the same access as if you clicked
  // a link to it.
  const sandboxFlags =
    "allow-forms allow-popups allow-popups-to-escape-sandbox " +
    "allow-same-origin allow-scripts allow-presentation allow-downloads";

  // Additional iframe feature permissions
  // (see - https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-permissions-in-cross-origin-iframes and https://wicg.github.io/feature-policy/)
  const iframeFeatures =
    "microphone; camera; encrypted-media; autoplay; display-capture; clipboard-write; clipboard-read;";

  // Set up event listener for messages coming from the iframe
  useEffect(() => {
    vm.setIFrameMessageForwarder(iFrameMessageForwarder);
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== targetOrigin) {
        console.error("Received message from untrusted origin:", event.origin);
        return;
      }

      console.log("Message from iframe:", JSON.stringify(event.data));
      vm.sendMsgToDriver(JSON.stringify(event.data));
    };

    window.addEventListener("message", handleMessage);
    return () => {
      vm.setIFrameMessageForwarder(null);
      window.removeEventListener("message", handleMessage);
    };
  }, [targetOrigin]);

  return (
    <iframe
      sandbox={sandboxFlags}
      allow={iframeFeatures}
      className={styles.iframe}
      ref={ref}
      src={snapshot.url ?? undefined}
    ></iframe>
  );
};
