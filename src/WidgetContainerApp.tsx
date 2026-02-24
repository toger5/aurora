import type React from "react";
// Wire up whatever ViewModel or props you need here.
// If you already have a WidgetViewModel you want to use, import and construct it.
import { Widget } from "./Widget";
import { WidgetViewModel } from "./viewmodel/WidgetViewModel";
import { useLocation } from "react-router";
import { ClientInterface, RoomInterface } from "./index.web";
import { useClientStoreContext } from "./context/ClientStoreContext";
import { useViewModel } from "@element-hq/web-shared-components";
import { useEffect } from "react";
import { RoomViewModel } from "./viewmodel/RoomViewModel";

// example URL
// ?roomId=!kwEcJlMIdGaaFRPxUY:matrix.org&widgetId=abc&widgetUrl=http%3A%2F%2Flocalhost%3A3000%2Fwebapptest%3FwidgetId%3D%24matrix_widget_id%26perParticipantE2EE%3Dtrue%26userId%3D%24matrix_user_id%26deviceId%3D%24org.matrix.msc2873.matrix_device_id%26baseUrl%3D%24org.matrix.msc4039.matrix_base_url%26roomId%3D%24matrix_room_id%0A
interface Props {
  roomViewModel: RoomViewModel;
}
export const WidgetContainer: React.FC<Props> = ({ roomViewModel }) => {
  const { widgetViewModel } = useViewModel(roomViewModel);

  useEffect(() => {
    const location = window.location;

    const widgetId = new URLSearchParams(location.search).get("widgetId");
    const widgetUrl = new URLSearchParams(location.search).get("widgetUrl");
    if (!widgetId) {
      console.warn("No widgetId!");
      return;
    }
    if (!widgetUrl) {
      console.warn("No widgetUrl!");
      return;
    }
    console.log("url", widgetUrl);
    widgetViewModel.setWidgetUrl(widgetUrl);
    widgetViewModel.run();
  }, [widgetViewModel]);
  // You likely want to get the widget configuration from query params or a store.
  // For demo purposes, we c§reate a simple view model with a static URL.
  // const vm = new WidgetViewModel({
  //   room,
  //   widgetId,
  //   initAfterContentLoad: false,
  //   rawUrl: widgetUrl,
  // });

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex" }}>
      <Widget widgetViewModel={widgetViewModel} />
    </div>
  );
};
