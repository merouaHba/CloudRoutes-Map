/* eslint-disable @typescript-eslint/no-explicit-any */
import "./App.css";
import "./i18n/index.ts";
import { MapContainer, Marker, TileLayer, useMap, Polyline } from "react-leaflet";
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

// Custom marker icons for route stops
const createRouteStopIcon = (type: "start" | "end" | "transfer" | "stop") => {
  let bgColor = "#06b6d4";
  let size = 24;

  switch (type) {
    case "start":
      bgColor = "#10b981";
      size = 32;
      break;
    case "end":
      bgColor = "#ef4444";
      size = 32;
      break;
    case "transfer":
      bgColor = "#f59e0b";
      size = 28;
      break;
    case "stop":
      bgColor = "#06b6d4";
      size = 20;
      break;
  }

  return L.divIcon({
    className: "custom-route-stop-icon",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${bgColor};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
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
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 10C28.25 10 32.5 11.5 32.5 13.25V14V15.5C33.3284 15.5 34 16.1716 34 17V20C34 20.8284 33.3284 21.5 32.5 21.5V29.25C32.5 30.0784 31.8284 30.75 31 30.75V32.25C31 33.0784 30.3284 33.75 29.5 33.75H28C27.1716 33.75 26.5 33.0784 26.5 32.25V30.75H17.5V32.25C17.5 33.0784 16.8284 33.75 16 33.75H14.5C13.6716 33.75 13 33.0784 13 32.25V30.75C12.1716 30.75 11.5 30.0784 11.5 29.25V21.5C10.6716 21.5 10 20.8284 10 20V17C10 16.1716 10.6716 15.5 11.5 15.5V14V13.25C11.5 11.5 15.75 10 22 10Z" fill="#0c4a6e"/>
              </svg>
            </div>
          </div>
        </div>
        <div><div className="loading-subtext">{t("loading")}</div></div>
        <div className="loading-spinner"></div>
        <div className="loading-progress-bar"><div className="loading-progress-fill"></div></div>
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
      <button className="zoom-button" onClick={() => map.zoomIn()} aria-label={t("controls.zoom_in")}>+</button>
      <div className="zoom-divider" />
      <button className="zoom-button" onClick={() => map.zoomOut()} aria-label={t("controls.zoom_out")}>−</button>
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
        map.fitBounds(allCoordinates as any, { padding: [50, 50] });
      }, 300);
    }
  }, [routeData, map]);

  return null;
}

// Route visualization component - renders directly on main map
function RouteVisualization({ routeData }: { routeData: RouteData }) {
  const getKeyStops = () => {
    const stops: Array<{
      location: LatLngExpression;
      type: "start" | "end" | "transfer" | "stop";
      name: string;
    }> = [];

    let isFirstBoarding = true;

    routeData.steps.forEach((step, stepIndex) => {
      // Start stop
      if (step.action === "board" && isFirstBoarding && step.at) {
        for (let i = stepIndex + 1; i < routeData.steps.length; i++) {
          const nextStep = routeData.steps[i];
          if (nextStep.action === "travel" && nextStep.polyline?.length) {
            stops.push({ location: nextStep.polyline[0], type: "start", name: step.at });
            break;
          }
        }
        isFirstBoarding = false;
      }

      // Transfer stops
      if (step.action === "transfer" && step.location && step.at) {
        stops.push({ location: step.location, type: "transfer", name: step.at });
      }

      // End stop
      if (step.action === "arrive" && step.location && step.at) {
        stops.push({ location: step.location, type: "end", name: step.at });
      }
    });

    return stops;
  };

  const keyStops = getKeyStops();

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
                weight: 5,
                opacity: 0.8,
                dashArray: step.type === "walk" ? "10, 10" : undefined,
              }}
            />
          );
        }
        return null;
      })}

      {/* Render key stop markers */}
      {keyStops.map((stop, index) => (
        <Marker
          key={`route-stop-${index}`}
          position={stop.location}
          icon={createRouteStopIcon(stop.type)}
          title={stop.name}
        />
      ))}
    </>
  );
}

function App() {
  const { t, i18n } = useTranslation();
  const { data: defaultLocation, isLoading, refetch, isRefetching } = useDefaultLocation();

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
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "WEB_APP_READY" }));
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
      map?.current?.flyTo([defaultLocation?.latitude, defaultLocation?.longitude], 15);
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
        </>
      )}
      
      <DevicePositionMarkers />

      {/* Route visualization - show when route exists */}
      {routeData && (
        <>
          <RouteVisualization routeData={routeData} />
          <FitRouteBounds routeData={routeData} />
        </>
      )}

      <ZoomControl />

      {/* Map Controls - position lower when in WebView to avoid search bar */}
      <div className={clsx("map-controls", { "map-controls-webview": isInWebView })}>
        <button className="control-button" onClick={() => setIsFiltersOpen(true)} aria-label={t("controls.filters")}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="24px" height="24px" fill="#0c4a6e">
            <path d="M400-240v-80h160v80H400ZM240-440v-80h480v80H240ZM120-640v-80h720v80H120Z" />
          </svg>
        </button>

        {!!window.env && (
          <button className={clsx("control-button", { active: displayLocation })} onClick={getLocation} aria-label={t("controls.my_location")}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" stroke="#0c4a6e" strokeWidth="2" fill="none" />
              <circle cx="12" cy="12" r="3" fill="#0c4a6e" />
            </svg>
          </button>
        )}
      </div>

      {displayLocation && location && <Marker position={location} title="Me" icon={userIcon()} />}

      <Modal isOpen={isFiltersOpen} onRequestClose={() => setIsFiltersOpen(false)} className="ReactModal__Content" overlayClassName="ReactModal__Overlay" closeTimeoutMS={300}>
        <Filters onApply={() => setIsFiltersOpen(false)} />
      </Modal>
    </MapContainer>
  );
}

export default App;