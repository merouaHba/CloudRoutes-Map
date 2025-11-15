/* eslint-disable @typescript-eslint/no-explicit-any */
import "./App.css";
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

createClientApi({
  baseURL: Env.API_URL,
});

initTraccarClient().catch((e) => console.error("ERROR:", e));

const isLineDisabled = window?.env?.LINE_IS_DISABLED ?? false;

// Professional Loading Component
function LoadingScreen() {
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
                  d="M22 10C28.25 10 32.5 11.5 32.5 13.25V14V15.5C33.3284 15.5 34 16.1716 34 17V20C34 20.8284 33.3284 21.5 32.5 21.5V29.25C32.5 30.0784 31.8284 30.75 31 30.75V32.25C31 33.0784 30.3284 33.75 29.5 33.75H28C27.1716 33.75 26.5 33.0784 26.5 32.25V30.75H17.5V32.25C17.5 33.0784 16.8284 33.75 16 33.75H14.5C13.6716 33.75 13 33.0784 13 32.25V30.75C12.1716 30.75 11.5 30.0784 11.5 29.25V21.5C10.6716 21.5 10 20.8284 10 20V17C10 16.1716 10.6716 15.5 11.5 15.5V14V13.25C11.5 11.5 15.75 10 22 10ZM14.5 17V21.5C14.5 22.3284 15.1716 23 16 23H20.75V15.5H16C15.1716 15.5 14.5 16.1716 14.5 17ZM23.25 23H28C28.8284 23 29.5 22.3284 29.5 21.5V17C29.5 16.1716 28.8284 15.5 28 15.5H23.25V23ZM16.625 28.75C17.039 28.75 17.4361 28.5854 17.7268 28.2947C18.0175 28.004 18.1821 27.6069 18.1821 27.1929C18.1821 26.7788 18.0175 26.3817 17.7268 26.091C17.4361 25.8004 17.039 25.6357 16.625 25.6357C16.211 25.6357 15.8139 25.8004 15.5232 26.091C15.2325 26.3817 15.0679 26.7788 15.0679 27.1929C15.0679 27.6069 15.2325 28.004 15.5232 28.2947C15.8139 28.5854 16.211 28.75 16.625 28.75ZM27.375 28.75C27.789 28.75 28.1861 28.5854 28.4768 28.2947C28.7675 28.004 28.9321 27.6069 28.9321 27.1929C28.9321 26.7788 28.7675 26.3817 28.4768 26.091C28.1861 25.8004 27.789 25.6357 27.375 25.6357C26.961 25.6357 26.5639 25.8004 26.2732 26.091C25.9825 26.3817 25.8179 26.7788 25.8179 27.1929C25.8179 27.6069 25.9825 28.004 26.2732 28.2947C26.5639 28.5854 26.961 28.75 27.375 28.75ZM26.5 13.25C26.5 12.8358 26.1642 12.5 25.75 12.5H18.25C17.8358 12.5 17.5 12.8358 17.5 13.25C17.5 13.6642 17.8358 14 18.25 14H25.75C26.1642 14 26.5 13.6642 26.5 13.25Z"
                  fill="#4338CA"
                />
              </svg>
            </div>
          </div>
        </div>
        <div>
          {/* <div className="loading-text">Loading Map</div> */}
          <div className="loading-subtext">Preparing your route...</div>
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
        aria-label="Zoom in"
      >
        +
      </button>
      <div className="zoom-divider" />
      <button
        className="zoom-button"
        onClick={handleZoomOut}
        aria-label="Zoom out"
      >
        −
      </button>
    </div>
  );
}

function App() {
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
            aria-label="Filters"
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
              aria-label="My location"
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
