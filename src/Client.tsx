import type React from "react";
import "./App.css";
import { useViewModel } from "@element-hq/web-shared-components";
import { useClientStoreContext } from "./context/ClientStoreContext";
import { RoomListHeader, RoomListSearch } from "./RoomList";
import { RoomListFiltersView } from "./RoomListFiltersView";
import { RoomListView } from "./RoomListView";
import { RoomView } from "./RoomView";
import { SidePanelView } from "./SidePanelView.tsx";
import { SplashView } from "./SplashView.tsx";
import { WidgetContainer } from "./WidgetContainerApp.tsx";
import { useCallback, useEffect, useState } from "react";
import { ClientState } from "./viewmodel/client-view.types.ts";

console.log("running Client.tsx");

interface ClientProps {
  onAddAccount: () => void;
}

export const Client: React.FC<ClientProps> = ({ onAddAccount }) => {
  const [clientViewModel] = useClientStoreContext();
  const { roomListViewModel, roomViewModel } = useViewModel(clientViewModel);
  const [roomId, setRoomId] = useState({});

  const openWidget = useCallback(async () => {
    console.log("callView model update");

    const urlRoomId = new URLSearchParams(location.search).get("roomId");
    if (
      urlRoomId &&
      clientViewModel.getSnapshot().clientState === ClientState.Syncing
    ) {
      clientViewModel.setCurrentRoom(urlRoomId);
      setRoomId(urlRoomId);
    } else {
      console.warn("No roomId for widget startup");
    }
  }, [clientViewModel]);
  useEffect(() => {
    openWidget();
    console.log("OMG, things are doing stuff bro.");
  }, [clientViewModel, openWidget]);
  // Handle room changes
  const handleRoomSelected = (roomId: string) => {
    clientViewModel.setCurrentRoom(roomId);
    setRoomId(roomId);
  };

  if (!roomListViewModel) return null;

  console.log(
    `roomListViewModel: ${roomListViewModel}, roomViewModel: ${roomViewModel}`,
  );

  return (
    <>
      <header className="mx_Header"> </header>
      <section className="mx_Client">
        <nav className="mx_SidePanel">
          <SidePanelView
            clientStore={clientViewModel}
            onAddAccount={onAddAccount}
          />
        </nav>
        {/*<nav className="mx_RoomList">
          <RoomListSearch />
          {
            <>
              <RoomListHeader />
              <RoomListFiltersView vm={roomListViewModel} />
              <RoomListView
                vm={roomListViewModel}
                onRoomSelected={handleRoomSelected}
              />
            </>
          }
        </nav>*/}
        {roomViewModel && roomViewModel?.getSnapshot().roomId === roomId ? (
          <WidgetContainer roomViewModel={roomViewModel} />
        ) : (
          // <RoomView roomViewModel={roomViewModel} />
          <SplashView />
        )}
      </section>
    </>
  );
};
