import "./App.css";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { LineMarkers } from "./components/LineMarkers.tsx";
import { createClientApi } from "@cloudroutes/query";
import { Env } from "./config/env.ts";
import { initTraccarClient } from "./helpers.ts";
import { DevicePositionMarkers } from "./components/BusMarkers";
import { BusStopsMarkers } from "./components/BusStopsMarkers.tsx";
import Modal from "react-modal";
import { useEffect, useRef, useState } from "react";
import { Filters } from "./components/Filters.tsx";
import { useDefaultLocation } from "@cloudroutes/query/lines";
import { Spinner } from "./components/Spinner.tsx";
import clsx from "clsx";
import { userIcon } from "./icons.ts";
import { useGlobalStore } from "./store";

// TODO: fetch traccar urls from api

createClientApi({
  baseURL: Env.API_URL,
});

initTraccarClient().catch((e) => console.error("ERROR:", e));

const isLineDisabled = window?.env?.LINE_IS_DISABLED ?? false;

function App() {
  const {
    data: defaultLocation,
    isLoading,
    refetch,
    isRefetching,
  } = useDefaultLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [displayLocation, setDisplayLocation] = useState(false);
  const map = useRef<any>(null);
  const leafletProvider = useGlobalStore((state) => state.leafletProvider);

  useEffect(() => {
    if (window.env) {
      window.addEventListener("message", (event) => {
        if ("latitude" in event.data) {
          setLocation([event.data.latitude, event.data.longitude]);
        }
      });
    }
  }, []);

  function getLocation() {
    setDisplayLocation((prev) => !prev);

    if (!displayLocation) {
      if (location) {
        map?.current?.flyTo(location, 15);
      }
    } else {
      map?.current?.flyTo(
        [defaultLocation?.latitude, defaultLocation?.longitude],
        15
      );
    }
  }

  if (isLoading || isRefetching)
    return (
      <div className="center min-h-screen">
        <Spinner />
      </div>
    );

  if (!defaultLocation)
    return (
      <div className="center min-h-screen">
        <div className="vstack align-items-center">
          <h1>No location found</h1>
          <button onClick={() => refetch()}>Try again</button>
        </div>
      </div>
    );

  return (
    <>
      <MapContainer
        ref={map}
        id="map"
        center={[defaultLocation.latitude, defaultLocation.longitude]}
        zoom={15}
        scrollWheelZoom
      >
        <TileLayer url={leafletProvider.url} />
        {!isLineDisabled && <LineMarkers />}

        <BusStopsMarkers />
        <DevicePositionMarkers />

        <button
          className="button button-square filters-menu"
          onClick={() => setIsOpen(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            width="20px"
            height="20px"
            fill="#1f1f1f"
          >
            <path d="M400-240v-80h160v80H400ZM240-440v-80h480v80H240ZM120-640v-80h720v80H120Z" />
          </svg>
        </button>

        {!!window.env && (
          <>
            <button
              className={clsx("button button-square location-button", {
                active: displayLocation,
              })}
              onClick={getLocation}
            >
              <svg
                id="Location_Off_24"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  width="24"
                  height="24"
                  stroke="none"
                  fill="#000000"
                  opacity="0"
                />
                <g transform="matrix(0.4 0 0 0.4 12 12)">
                  <path
                    stroke="none"
                    strokeWidth={1}
                    strokeDasharray="none"
                    strokeDashoffset={0}
                    strokeLinejoin="miter"
                    strokeMiterlimit={4}
                    fillRule="nonzero"
                    opacity={1}
                    transform="translate(-25, -25)"
                    d="M 23 0 L 23 4.0957031 C 13.018702 5.0446992 5.046896 13.018494 4.0976562 23 L 0 23 L 0 27 L 4.0976562 27 C 5.046896 36.981506 13.018702 44.955301 23 45.904297 L 23 50 L 27 50 L 27 45.902344 C 36.981223 44.953131 44.953131 36.981223 45.902344 27 L 50 27 L 50 23 L 45.902344 23 C 44.953131 13.018777 36.981223 5.046869 27 4.0976562 L 27 0 L 23 0 z M 27 8.1269531 C 34.805997 9.0369175 40.963083 15.194003 41.873047 23 L 39 23 L 39 27 L 41.873047 27 C 40.963083 34.805997 34.805997 40.963083 27 41.873047 L 27 39 L 23 39 L 23 41.871094 C 15.196372 40.959902 9.0368425 34.805354 8.1269531 27 L 11 27 L 11 23 L 8.1269531 23 C 9.0368425 15.194646 15.196372 9.0400983 23 8.1289062 L 23 11 L 27 11 L 27 8.1269531 z M 20.978516 18.980469 C 20.165025870540457 18.981476654703446 19.43318106808401 19.47506340456152 19.127438916168853 20.228912820982597 C 18.821696764253694 20.98276223740367 19.002969696841884 21.84668631880715 19.585938 22.414062 L 22.171875 25 L 19.585938 27.585938 C 19.063456410414243 28.087571146274303 18.8529867299941 28.832471984436292 19.03570037803193 29.533356103044937 C 19.218414026069762 30.234240221653586 19.765759778346414 30.78158597393024 20.466643896955063 30.96429962196807 C 21.16752801556371 31.1470132700059 21.912428853725697 30.936543589585757 22.414062 30.414062 L 25 27.828125 L 27.585938 30.414062 C 28.087571146274303 30.936543589585757 28.83247198443629 31.1470132700059 29.533356103044937 30.96429962196807 C 30.234240221653586 30.781585973930238 30.781585973930238 30.234240221653586 30.96429962196807 29.533356103044937 C 31.1470132700059 28.83247198443629 30.936543589585757 28.087571146274303 30.414062 27.585938 L 27.828125 25 L 30.414062 22.414062 C 31.0055823092363 21.839079220204013 31.183438764082922 20.959930425547107 30.861930489808206 20.200237130279984 C 30.54042221553349 19.44054383501286 29.78550466133776 18.95615245601811 28.960938 18.980469 C 28.44134072383389 18.995951324653216 27.948181176214312 19.213109737844256 27.585938 19.585938 L 25 22.171875 L 22.414062 19.585938 C 22.037047603547457 19.19838649972553 21.519196843485222 18.979973030673253 20.978516 18.980469 z"
                    strokeLinecap="round"
                  />
                </g>
              </svg>
            </button>

            {displayLocation && location && (
              <Marker position={location} title="Me" icon={userIcon()} />
            )}
          </>
        )}

        <Modal
          isOpen={isOpen}
          onRequestClose={() => setIsOpen(false)}
          style={{
            content: {
              bottom: "0",
              left: "50%",
              right: "auto",
              top: "auto",
              transform: "translateX(-50%)",
              width: "90%",
              maxWidth: "500px",
              borderRadius: "16px 16px 0 0",
              padding: "20px",
            },
            overlay: { zIndex: 99999 },
          }}
        >
          <Filters onApply={() => setIsOpen(false)} />
        </Modal>
      </MapContainer>
    </>
  );
}

export default App;
