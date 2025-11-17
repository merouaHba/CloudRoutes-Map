/* eslint-disable @typescript-eslint/no-explicit-any */
import "./App.css";
import "./i18n/index.ts"; // Import i18n first
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
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
import clsx from "clsx";
import { userIcon } from "./icons.ts";
import { useGlobalStore } from "./store";
import { SearchBar } from "./components/SearchBar.tsx";
import { RouteDisplay } from "./components/RouteDisplay.tsx";
import { useTranslation } from "react-i18next";

createClientApi({
  baseURL: Env.API_URL,
});

initTraccarClient().catch((e) => console.error("ERROR:", e));

// Initialize React Modal
Modal.setAppElement("#root");

const isLineDisabled = window?.env?.LINE_IS_DISABLED ?? false;

// Loading Screen Component
function LoadingScreen() {
  const { t } = useTranslation();

  return (
    <div className="map-loading-overlay">
      <div className="loading-content">
        <div className="loading-icon-container">
          <div className="loading-icon-circle">
            <div className="loading-icon-inner">
              <svg
                width="44"
                height="44"
                viewBox="0 0 44 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22 10C28.25 10 32.5 11.5 32.5 13.25V14V15.5C33.3284 15.5 34 16.1716 34 17V20C34 20.8284 33.3284 21.5 32.5 21.5V29.25C32.5 30.0784 31.8284 30.75 31 30.75V32.25C31 33.0784 30.3284 33.75 29.5 33.75H28C27.1716 33.75 26.5 33.0784 26.5 32.25V30.75H17.5V32.25C17.5 33.0784 16.8284 33.75 16 33.75H14.5C13.6716 33.75 13 33.0784 13 32.25V30.75C12.1716 30.75 11.5 30.0784 11.5 29.25V21.5C10.6716 21.5 10 20.8284 10 20V17C10 16.1716 10.6716 15.5 11.5 15.5V14V13.25C11.5 11.5 15.75 10 22 10Z"
                  fill="#4338CA"
                />
              </svg>
            </div>
          </div>
        </div>
        <div>
          <div className="loading-subtext">{t("loading")}</div>
        </div>
        <div className="loading-spinner"></div>
        <div className="loading-progress-bar">
          <div className="loading-progress-fill"></div>
        </div>
      </div>
    </div>
  );
}

// Zoom Control Component
function ZoomControl() {
  const map = useMap();
  const { t } = useTranslation();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  return (
    <div className="zoom-controls">
      <button
        className="zoom-button"
        onClick={handleZoomIn}
        aria-label={t("controls.zoom_in")}
      >
        +
      </button>
      <div className="zoom-divider" />
      <button
        className="zoom-button"
        onClick={handleZoomOut}
        aria-label={t("controls.zoom_out")}
      >
        −
      </button>
    </div>
  );
}

function App() {
  const { t, i18n } = useTranslation();
  const {
    data: defaultLocation,
    isLoading,
    refetch,
    isRefetching,
  } = useDefaultLocation();

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [displayLocation, setDisplayLocation] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const map = useRef<any>(null);
  const leafletProvider = useGlobalStore((state) => state.leafletProvider);

  // Handle messages from React Native (location and language)
  useEffect(() => {
    if (window.env) {
      window.addEventListener("message", (event) => {
        if (event.data) {
          // Handle location updates
          if (
            event.data.type === "LOCATION_UPDATE" &&
            "latitude" in event.data
          ) {
            setLocation([event.data.latitude, event.data.longitude]);
          }

          // Handle language changes
          if (event.data.type === "LANGUAGE_CHANGE" && event.data.language) {
            i18n.changeLanguage(event.data.language);
          }

          // Legacy support - if no type specified, assume location
          if (!event.data.type && "latitude" in event.data) {
            setLocation([event.data.latitude, event.data.longitude]);
          }
        }
      });
    }
  }, [i18n]);

  // Update document direction when language changes
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

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

  const handleRouteFound = (data: any) => {
    setRouteData(data);
  };

  const handleClearRoute = () => {
    setRouteData(null);
  };

  if (isLoading || isRefetching) {
    return <LoadingScreen />;
  }

  if (!defaultLocation)
    return (
      <div className="center min-h-screen">
        <div className="vstack align-items-center">
          <h1>{t("search.no_route_found")}</h1>
          <button onClick={() => refetch()}>{t("search.searching")}</button>
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
        zoomControl={false}
      >
        <TileLayer url={leafletProvider.url} />
        {!isLineDisabled && <LineMarkers />}

        <BusStopsMarkers />
        <DevicePositionMarkers />

        {/* Route visualization */}
        {routeData && (
          <RouteDisplay
            routeData={routeData}
            onClose={handleClearRoute}
            mapRef={map}
          />
        )}

        {/* Zoom Control */}
        <ZoomControl />

        {/* Map Controls */}
        <div className="map-controls">
          {/* Filters button */}
          <button
            className="control-button"
            onClick={() => setIsFiltersOpen(true)}
            aria-label={t("controls.filters")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 -960 960 960"
              width="24px"
              height="24px"
              fill="#4338ca"
            >
              <path d="M400-240v-80h160v80H400ZM240-440v-80h480v80H240ZM120-640v-80h720v80H120Z" />
            </svg>
          </button>

          {/* Location button */}
          {!!window.env && (
            <button
              className={clsx("control-button", {
                active: displayLocation,
              })}
              onClick={getLocation}
              aria-label={t("controls.my_location")}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="8"
                  stroke="#4338ca"
                  strokeWidth="2"
                  fill="none"
                />
                <circle cx="12" cy="12" r="3" fill="#4338ca" />
              </svg>
            </button>
          )}
        </div>

        {/* User location marker */}
        {displayLocation && location && (
          <Marker position={location} title="Me" icon={userIcon()} />
        )}

        {/* Filters modal */}
        <Modal
          isOpen={isFiltersOpen}
          onRequestClose={() => setIsFiltersOpen(false)}
          className="ReactModal__Content"
          overlayClassName="ReactModal__Overlay"
          closeTimeoutMS={300}
        >
          <Filters onApply={() => setIsFiltersOpen(false)} />
        </Modal>
      </MapContainer>

      {/* Search Bar - Fixed at top */}
      <SearchBar
        onRouteFound={handleRouteFound}
        onClearRoute={handleClearRoute}
        currentLocation={location}
      />
    </>
  );
}

export default App;
