/* eslint-disable @typescript-eslint/no-explicit-any */
import { Polyline, Marker, MapContainer, TileLayer } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { busStopIcon } from "../icons";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import Modal from "react-modal";
import { useGlobalStore } from "../store";

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
  buses_available?: any[];
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

type RouteDisplayProps = {
  routeData: RouteData;
  onClose: () => void;
  mapRef?: any;
};

export function RouteDisplay({
  routeData,
  onClose,
}: RouteDisplayProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // No need for complex click-outside detection - handled by overlay
  // Just prevent closing when route map modal is open
  useEffect(() => {
    // Prevent body scroll when panel is open
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const getTransferText = () => {
    const transfers = routeData.metadata?.transfers ?? 0;
    if (transfers === 0) return t("route.direct_route");
    if (transfers === 1)
      return `1 ${t("route.transfer")} ${t("route.transfer_required")}`;
    return `${transfers} ${t("route.transfers")} ${t("route.transfers_required")}`;
  };

  const handleShowRoute = () => {
    setIsRouteModalOpen(true);
  };

  return (
    <>
      {/* Route visualization on main map */}
      {routeData.steps.map((step, index) => (
        <RouteStepVisual key={index} step={step} index={index} />
      ))}

      {/* Overlay - click to close */}
      <div className="route-results-wrapper">
        <div className="route-overlay" onClick={onClose}></div>

        {/* Mobile-optimized results panel */}

        <div
          ref={panelRef}
          className={`route-results-panel ${isRTL ? "rtl" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="route-drag-handle"></div>

          {/* Header */}
          <div className="route-results-header">
            <div className="route-header-left">
              <div className="route-icon-badge">
                {routeData.metadata?.transfers === 0 ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7 18V7.414a1 1 0 01.293-.707l2.414-2.414A1 1 0 0110.414 4H17a1 1 0 011 1v13M7 14h10"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
              <div className="route-header-info">
                <h3 className="route-results-title">{routeData.summary}</h3>
                <p className="route-results-subtitle">{getTransferText()}</p>
              </div>
            </div>
            <button
              className="route-close-btn"
              onClick={onClose}
              aria-label={t("filters.close")}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Quick stats */}
          <div className="route-quick-stats">
            <div className="quick-stat">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 6v6l4 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="stat-value">{routeData.total_time}</span>
              <span className="stat-label">{t("route.minutes")}</span>
            </div>
            <div className="quick-stat-divider"></div>
            <div className="quick-stat">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="stat-value">
                {routeData.total_distance.toFixed(1)}
              </span>
              <span className="stat-label">{t("nearby.km")}</span>
            </div>
            <div className="quick-stat-divider"></div>
            <div className="quick-stat">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 18V7.414a1 1 0 01.293-.707l2.414-2.414A1 1 0 0110.414 4H17a1 1 0 011 1v13M7 14h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="stat-value">
                {routeData.metadata?.transfers ?? 0}
              </span>
              <span className="stat-label">
                {routeData.metadata?.transfers === 1
                  ? t("route.transfer")
                  : t("route.transfers")}
              </span>
            </div>
          </div>

          {/* Warning message */}
          {routeData.metadata?.warning && (
            <div className="route-warning-message">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 9v4m0 4h.01M4.93 19h14.14c1.45 0 2.37-1.55 1.68-2.83L13.68 4.83c-.69-1.28-2.67-1.28-3.36 0L3.25 16.17C2.56 17.45 3.48 19 4.93 19z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>{routeData.metadata.warning}</span>
            </div>
          )}

          {/* Route steps - scrollable */}
          <div className="route-steps-container">
            {routeData.steps.map((step, index) => (
              <RouteStepCard key={index} step={step} index={index} />
            ))}
          </div>

          {/* Show route button */}
          <div className="route-action-footer">
            <button className="show-route-btn" onClick={handleShowRoute}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{t("route.show_route_on_map")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen route map modal */}
      <RouteMapModal
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        routeData={routeData}
      />
    </>
  );
}

function RouteStepVisual({ step }: { step: RouteStep; index: number }) {
  if (step.polyline && step.polyline.length > 0) {
    return (
      <Polyline
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

  if (
    step.location &&
    (step.action === "transfer" || step.action === "arrive")
  ) {
    return <Marker position={step.location} icon={busStopIcon} />;
  }

  return null;
}

function RouteStepCard({ step }: { step: RouteStep; index: number }) {
  const { t } = useTranslation();

  const getStepIcon = () => {
    switch (step.action) {
      case "walk":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"
              fill="white"
            />
          </svg>
        );
      case "board":
      case "travel":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C8 2 4 2.5 4 6v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4z"
              fill="white"
            />
          </svg>
        );
      case "transfer":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 10l5 5 5-5M7 14l5 5 5-5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "arrive":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="9" fill="white" />
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill="white"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStepColor = () => {
    if (step.color) return step.color;
    switch (step.action) {
      case "walk":
        return "#6b7280";
      case "board":
      case "travel":
        return "#0c4a6e";
      case "transfer":
        return "#f59e0b";
      case "arrive":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const getStepTitle = () => {
    switch (step.action) {
      case "walk":
        return t("route.walk");
      case "board":
        return `${t("route.board")} ${step.line || ""}`;
      case "travel":
        return `${step.line || ""}`;
      case "transfer":
        return t("route.transfer_at");
      case "arrive":
        return t("route.arrive");
      default:
        return step.action;
    }
  };

  return (
    <div className="route-step-card">
      <div className="step-timeline">
        <div className="step-dot" style={{ backgroundColor: getStepColor() }}>
          {getStepIcon()}
        </div>
        <div className="step-line"></div>
      </div>
      <div className="step-card-content">
        <div className="step-card-header">
          <h4 className="step-card-title" style={{ color: getStepColor() }}>
            {getStepTitle()}
          </h4>
          {step.duration && (
            <span className="step-duration">
              {step.duration} {t("route.minutes").toLowerCase()}
            </span>
          )}
        </div>
        <div className="step-card-details">
          {step.action === "walk" && (
            <>
              {step.distance && (
                <p className="step-detail">
                  {step.distance.toFixed(2)} {t("nearby.km")}
                </p>
              )}
              {step.from && (
                <p className="step-detail">
                  {t("route.from")}: {step.from}
                </p>
              )}
              {step.to && (
                <p className="step-detail">
                  {t("route.to")}: {step.to}
                </p>
              )}
            </>
          )}
          {step.action === "board" && (
            <>
              {step.at && (
                <p className="step-detail">
                  {t("route.at")}: {step.at}
                </p>
              )}
            </>
          )}
          {step.action === "travel" && (
            <>
              {step.stops && (
                <p className="step-detail">
                  {step.stops} {t("route.stops")}
                </p>
              )}
              {step.distance && (
                <p className="step-detail">
                  {step.distance.toFixed(1)} {t("nearby.km")}
                </p>
              )}
            </>
          )}
          {step.action === "transfer" && (
            <>
              {step.at && (
                <p className="step-detail">
                  {t("route.at")}: {step.at}
                </p>
              )}
              {step.to && (
                <p className="step-detail">
                  {t("route.change_to")}: {step.to}
                </p>
              )}
            </>
          )}
          {step.action === "arrive" && (
            <>{step.at && <p className="step-detail">{step.at}</p>}</>
          )}
        </div>
      </div>
    </div>
  );
}

function RouteMapModal({
  isOpen,
  onClose,
  routeData,
}: {
  isOpen: boolean;
  onClose: () => void;
  routeData: RouteData;
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const leafletProvider = useGlobalStore((state) => state.leafletProvider);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && mapRef.current && routeData.steps) {
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
          if (mapRef.current) {
            const map = mapRef.current;
            map.fitBounds(allCoordinates as any, {
              padding: [80, 80],
            });
          }
        }, 300);
      }
    }
  }, [isOpen, routeData]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const center: LatLngExpression = routeData.steps[0]?.polyline?.[0] ||
    routeData.steps[0]?.location || [36.7538, 3.0588];

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="route-map-modal"
      overlayClassName="route-map-modal-overlay"
      closeTimeoutMS={300}
      shouldCloseOnOverlayClick={false}
    >
      <div className={`route-map-container ${isRTL ? "rtl" : ""}`}>
        {/* Header */}
        <div className="route-map-header">
          <h3 className="route-map-title">{t("route.route_map")}</h3>
          <button
            className="route-map-close"
            onClick={onClose}
            aria-label={t("route.return_to_results")}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 12H5M5 12l7 7M5 12l7-7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Map */}
        <div className="route-map-wrapper">
          <MapContainer
            ref={(map) => {
              if (map) {
                mapRef.current = map;
              }
            }}
            center={center}
            zoom={13}
            scrollWheelZoom={true}
            zoomControl={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url={leafletProvider.url} />

            {/* Render route polylines */}
            {routeData.steps.map((step, index) => {
              if (step.polyline && step.polyline.length > 0) {
                return (
                  <Polyline
                    key={`polyline-${index}`}
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

            {/* Render markers for stops */}
            {routeData.steps.map((step, index) => {
              if (
                step.location &&
                (step.action === "board" ||
                  step.action === "transfer" ||
                  step.action === "arrive")
              ) {
                return (
                  <Marker
                    key={`marker-${index}`}
                    position={step.location}
                    icon={busStopIcon}
                  />
                );
              }
              return null;
            })}
          </MapContainer>
        </div>

        {/* Zoom controls */}
        <div className="route-map-zoom-controls">
          <button
            className="route-map-zoom-btn"
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.zoomIn();
              }
            }}
            aria-label={t("controls.zoom_in")}
          >
            +
          </button>
          <div className="route-map-zoom-divider"></div>
          <button
            className="route-map-zoom-btn"
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.zoomOut();
              }
            }}
            aria-label={t("controls.zoom_out")}
          >
            −
          </button>
        </div>
      </div>
    </Modal>
  );
}
