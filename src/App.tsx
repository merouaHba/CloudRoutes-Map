/* eslint-disable @typescript-eslint/no-explicit-any */
import "./App.css";
import "./i18n/index.ts";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  Polyline,
  Popup,
} from "react-leaflet";
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
import { useTranslation } from "react-i18next";
import { LatLngExpression } from "leaflet";
import L from "leaflet";

createClientApi({
  baseURL: Env.API_URL,
});

initTraccarClient().catch((e) => console.error("ERROR:", e));

Modal.setAppElement("#root");

const isLineDisabled = window?.env?.LINE_IS_DISABLED ?? false;

// Extend window type for React Native communication
declare global {
  interface Window {
    env?: {
      API_URL?: string;
      TRACCAR_URL?: string;
      TRACCAR_WS_URL?: string;
      TRACCAR_TOKEN?: string;
      LINE_IS_DISABLED?: boolean;
    };
    language?: string;
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

// Route data types
type RouteStep = {
  action: string;
  type?: string;
  line?: string;
  at?: string;
  to?: string;
  from?: string;
  stops?: number;
  polyline?: LatLngExpression[];
  color?: string;
  stops_between?: string[];
  duration?: number;
  distance?: number;
  location?: LatLngExpression;
};

type RouteData = {
  success: boolean;
  type: string;
  summary: string;
  total_time: number;
  total_price: number;
  total_distance: number;
  steps: RouteStep[];
  metadata?: {
    transfers?: number;
    lines_used?: string[];
    total_stops?: number;
    warning?: string | null;
  };
};

// Custom marker icons for different stop types (same as RouteDisplay)
const createStopIcon = (
  action: "board" | "arrive" | "transfer" | "travel",
  stopName?: string
): L.DivIcon => {
  // For regular stops, use the bus stop icon style
  if (action === "travel") {
    return L.divIcon({
      className: "custom-bus-stop-icon",
      html: `
        <div style="
          width: 30px;
          height: 30px;
          background: white;
          border: 2px solid #06b6d4;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        " title="${stopName || ""}">
          <svg width="20" height="20" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 3V12C20 12.71 19.62 13.36 19 13.72V15.25C19 15.66 18.66 16 18.25 16H17.75C17.34 16 17 15.66 17 15.25V14H10V15.25C10 15.66 9.66 16 9.25 16H8.75C8.34 16 8 15.66 8 15.25V13.72C7.39 13.36 7 12.71 7 12V3C7 0 10 0 13.5 0C17 0 20 0 20 3ZM11 11C11 10.45 10.55 10 10 10C9.45 10 9 10.45 9 11C9 11.55 9.45 12 10 12C10.55 12 11 11.55 11 11ZM18 11C18 10.45 17.55 10 17 10C16.45 10 16 10.45 16 11C16 11.55 16.45 12 17 12C17.55 12 18 11.55 18 11ZM18 3H9V7H18V3ZM5 5.5C4.97 4.12 3.83 3 2.45 3.05C1.07 3.08 -0.0299996 4.22 4.40981e-07 5.6C0.0300004 6.77 0.86 7.77 2 8V16H3V8C4.18 7.76 5 6.71 5 5.5Z" fill="#06b6d4"/>
          </svg>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });
  }

  // For special stops, use meaningful icons
  let bgColor = "#06b6d4";
  const borderColor = "white";
  let size = 40;
  let borderWidth = 4;
  let iconSvg = "";

  switch (action) {
    case "board":
      bgColor = "#10b981"; // Green for start
      iconSvg = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="8" stroke="white" stroke-width="2.5" fill="none"/>
          <circle cx="12" cy="12" r="3" fill="white"/>
        </svg>
      `;
      break;
    case "arrive":
      bgColor = "#ef4444"; // Red for end
      iconSvg = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white"/>
          <circle cx="12" cy="9" r="2.5" fill="${bgColor}"/>
        </svg>
      `;
      break;
    case "transfer":
      bgColor = "#f59e0b"; // Orange for transfer
      size = 36;
      borderWidth = 3;
      iconSvg = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 17l5-5-5-5M8 7l-5 5 5 5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      break;
  }

  return L.divIcon({
    className: "custom-stop-icon",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${bgColor};
        border: ${borderWidth}px solid ${borderColor};
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        position: relative;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      " title="${stopName || ""}">
        ${iconSvg}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 5],
  });
};

// Get all stops from route data with their types
const getAllStopsFromRoute = (
  routeData: RouteData
): Array<{
  location: LatLngExpression;
  action: "board" | "arrive" | "transfer" | "travel";
  name: string;
  line?: string;
}> => {
  const stops: Array<{
    location: LatLngExpression;
    action: "board" | "arrive" | "transfer" | "travel";
    name: string;
    line?: string;
  }> = [];

  let isFirstBoarding = true;
  const processedStopNames = new Set<string>();

  // First pass: collect all special stops (board, transfer, arrive) with their names
  const specialStops = new Map<string, "board" | "arrive" | "transfer">();

  routeData.steps.forEach((step) => {
    if (step.action === "board" && step.at && isFirstBoarding) {
      specialStops.set(step.at, "board");
      isFirstBoarding = false;
    }
    if (step.action === "transfer" && step.at) {
      specialStops.set(step.at, "transfer");
    }
    if (step.action === "arrive" && step.at) {
      specialStops.set(step.at, "arrive");
    }
  });

  // Second pass: process all stops with correct actions
  isFirstBoarding = true;
  routeData.steps.forEach((step, stepIndex) => {
    // Start stop - board action
    if (step.action === "board" && isFirstBoarding && step.at) {
      let location = null;

      // Look for the next travel step to get polyline start point
      for (let i = stepIndex + 1; i < routeData.steps.length; i++) {
        const nextStep = routeData.steps[i];
        if (
          nextStep.action === "travel" &&
          nextStep.polyline &&
          nextStep.polyline.length > 0
        ) {
          location = nextStep.polyline[0];
          break;
        }
      }

      if (location) {
        stops.push({
          location: location,
          action: "board",
          name: step.at,
          line: step.line,
        });
        processedStopNames.add(step.at);
        isFirstBoarding = false;
      }
    }

    // Transfer stops
    if (step.action === "transfer" && step.location && step.at) {
      if (!processedStopNames.has(step.at)) {
        stops.push({
          location: step.location,
          action: "transfer",
          name: step.at,
        });
        processedStopNames.add(step.at);
      }
    }

    // Regular stops from travel steps (stops_between)
    if (step.action === "travel" && step.stops_between && step.polyline) {
      const stopsCount = step.stops_between.length;
      const polylineLength = step.polyline.length;

      step.stops_between.forEach((stopName, idx) => {
        // Skip if already processed or is a special stop
        if (processedStopNames.has(stopName) || specialStops.has(stopName)) {
          return;
        }

        // Estimate stop location along the polyline
        const progress = (idx + 1) / (stopsCount + 1);
        const polylineIndex = Math.floor(progress * (polylineLength - 1));
        const stopLocation = step.polyline![polylineIndex];

        if (stopLocation) {
          stops.push({
            location: stopLocation,
            action: "travel",
            name: stopName,
            line: step.line,
          });
          processedStopNames.add(stopName);
        }
      });
    }

    // End stop
    if (step.action === "arrive" && step.location && step.at) {
      if (!processedStopNames.has(step.at)) {
        stops.push({
          location: step.location,
          action: "arrive",
          name: step.at,
        });
        processedStopNames.add(step.at);
      }
    }
  });

  return stops;
};

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
                  fill="#0c4a6e"
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

  return (
    <div className="zoom-controls">
      <button
        className="zoom-button"
        onClick={() => map.zoomIn()}
        aria-label={t("controls.zoom_in")}
      >
        +
      </button>
      <div className="zoom-divider" />
      <button
        className="zoom-button"
        onClick={() => map.zoomOut()}
        aria-label={t("controls.zoom_out")}
      >
        −
      </button>
    </div>
  );
}

// Component to fit map bounds when route is displayed
function FitRouteBounds({ routeData }: { routeData: RouteData | null }) {
  const map = useMap();

  useEffect(() => {
    if (!routeData) return;

    const allCoordinates: LatLngExpression[] = [];
    routeData.steps.forEach((step) => {
      if (step.polyline && step.polyline.length > 0) {
        allCoordinates.push(...step.polyline);
      }
      if (step.location) {
        allCoordinates.push(step.location);
      }
    });

    if (allCoordinates.length > 0) {
      setTimeout(() => {
        map.fitBounds(allCoordinates as any, { padding: [80, 80] });
      }, 300);
    }
  }, [routeData, map]);

  return null;
}

// Route visualization component - renders directly on main map
function RouteVisualization({ routeData }: { routeData: RouteData }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Get all stops using the same logic as RouteMapModal
  const allStops = getAllStopsFromRoute(routeData);

  // Get action label for popup
  const getActionLabel = (action: string) => {
    switch (action) {
      case "board":
        return t("route.board");
      case "arrive":
        return t("route.arrive");
      case "transfer":
        return t("route.transfer");
      default:
        return t("bus_stop.title");
    }
  };

  // Get background color for popup badge
  const getActionBgColor = (action: string) => {
    switch (action) {
      case "board":
        return "#d1fae5";
      case "arrive":
        return "#fee2e2";
      case "transfer":
        return "#fef3c7";
      default:
        return "#f0f9ff";
    }
  };

  return (
    <>
      {/* Render polylines */}
      {routeData.steps.map((step, index) => {
        if (step.polyline && step.polyline.length > 0) {
          return (
            <Polyline
              key={`route-polyline-${index}`}
              positions={step.polyline}
              pathOptions={{
                color: step.color || "#0c4a6e",
                weight: 6,
                opacity: 0.9,
                dashArray: step.type === "walk" ? "10, 10" : undefined,
              }}
            />
          );
        }
        return null;
      })}

      {/* Render all stop markers with popups */}
      {allStops.map((stop, index) => (
        <Marker
          key={`route-stop-${index}-${stop.name}`}
          position={stop.location}
          icon={createStopIcon(stop.action, stop.name)}
          title={stop.name}
        >
          <Popup>
            <div
              style={{
                textAlign: "center",
                padding: "8px",
                minWidth: "150px",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  marginBottom: "6px",
                  color: "#1f2937",
                  direction: isRTL ? "rtl" : "ltr",
                }}
              >
                {stop.name}
              </div>
              {stop.line && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  {t("filters.lines")}: {stop.line}
                </div>
              )}
              <div
                style={{
                  fontSize: "11px",
                  color: "#9ca3af",
                  marginTop: "6px",
                  padding: "4px 8px",
                  backgroundColor: getActionBgColor(stop.action),
                  borderRadius: "6px",
                  fontWeight: "600",
                }}
              >
                {getActionLabel(stop.action)}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
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
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [appReady, setAppReady] = useState(false);
  const map = useRef<any>(null);
  const leafletProvider = useGlobalStore((state) => state.leafletProvider);

  // Check if running in React Native WebView
  const isInWebView = !!window.ReactNativeWebView;

  // Send ready signal to React Native when app is loaded
  useEffect(() => {
    if (!isLoading && !isRefetching && defaultLocation && !appReady) {
      setAppReady(true);
      // Small delay to ensure map is rendered
      setTimeout(() => {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: "WEB_APP_READY" })
          );
        }
      }, 500);
    }
  }, [isLoading, isRefetching, defaultLocation, appReady]);

  // Handle messages from React Native
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      const data = event.data;

      // Handle location updates
      if (data.type === "LOCATION_UPDATE" && "latitude" in data) {
        setLocation([data.latitude, data.longitude]);
      }

      // Handle language changes
      if (data.type === "LANGUAGE_CHANGE" && data.language) {
        i18n.changeLanguage(data.language);
      }

      // Handle route data from React Native
      if (data.type === "ROUTE_DATA" && data.routeData) {
        setRouteData(data.routeData);
      }

      // Handle clear route
      if (data.type === "CLEAR_ROUTE") {
        setRouteData(null);
      }

      // Legacy support
      if (!data.type && "latitude" in data) {
        setLocation([data.latitude, data.longitude]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [i18n]);

  // Update document direction when language changes
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  function getLocation() {
    setDisplayLocation((prev) => !prev);
    if (!displayLocation && location) {
      map?.current?.flyTo(location, 15);
    } else {
      map?.current?.flyTo(
        [defaultLocation?.latitude, defaultLocation?.longitude],
        15
      );
    }
  }

  // Show loading only when NOT in WebView (React Native handles loading)
  if ((isLoading || isRefetching) && !isInWebView) return <LoadingScreen />;

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
    <MapContainer
      ref={map}
      id="map"
      center={[defaultLocation.latitude, defaultLocation.longitude]}
      zoom={15}
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer url={leafletProvider.url} />

      {/* Regular map layers - show when NO route */}
      {!routeData && (
        <>
          {!isLineDisabled && <LineMarkers />}
          <BusStopsMarkers />
          <DevicePositionMarkers />
        </>
      )}

      {/* Route visualization - show when route exists */}
      {routeData && (
        <>
          <RouteVisualization routeData={routeData} />
          <FitRouteBounds routeData={routeData} />
        </>
      )}

      <ZoomControl />

      {/* Map Controls - position lower when in WebView to avoid search bar */}
      <div
        className={clsx("map-controls", {
          "map-controls-webview": isInWebView,
        })}
      >
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
            fill="#0c4a6e"
          >
            <path d="M400-240v-80h160v80H400ZM240-440v-80h480v80H240ZM120-640v-80h720v80H120Z" />
          </svg>
        </button>

        {!!window.env && (
          <button
            className={clsx("control-button", { active: displayLocation })}
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
                stroke="#0c4a6e"
                strokeWidth="2"
                fill="none"
              />
              <circle cx="12" cy="12" r="3" fill="#0c4a6e" />
            </svg>
          </button>
        )}
      </div>

      {displayLocation && location && (
        <Marker position={location} title="Me" icon={userIcon()} />
      )}

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
  );
}

export default App;
