import { Polyline, Marker, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { busIcon, busStopIcon } from "../icons";
import { useEffect } from "react";

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
  mapRef,
}: RouteDisplayProps) {
  // Auto-fit map to route bounds when route is loaded
  useEffect(() => {
    if (mapRef?.current && routeData.steps) {
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
        const bounds = allCoordinates as any;
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [routeData, mapRef]);

  return (
    <>
      {/* Route lines and markers on map */}
      {routeData.steps.map((step, index) => (
        <RouteStepVisual key={index} step={step} index={index} />
      ))}

      {/* Route details panel */}
      <div className="route-details-panel">
        <div className="route-details-header">
          <div className="route-header-content">
            <div className="route-type-badge">
              {routeData.metadata?.transfers === 0 ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 18V7.414a1 1 0 01.293-.707l2.414-2.414A1 1 0 0110.414 4H17a1 1 0 011 1v13M7 14h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </div>
            <div>
              <h3 className="route-title">{routeData.summary}</h3>
              <div className="route-subtitle">
                {routeData.metadata?.transfers === 0 
                  ? "Direct Route Available" 
                  : `${routeData.metadata?.transfers} Transfer${routeData.metadata?.transfers > 1 ? 's' : ''} Required`
                }
              </div>
            </div>
          </div>
          <button className="close-button-enhanced" onClick={onClose}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="route-summary-enhanced">
          <div className="summary-card">
            <div className="summary-icon time-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                <path
                  d="M12 6v6l4 2"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <div className="summary-value">{routeData.total_time}</div>
              <div className="summary-label">Minutes</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon distance-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div className="summary-value">{routeData.total_distance.toFixed(1)}</div>
              <div className="summary-label">Kilometers</div>
            </div>
          </div>

          {routeData.metadata?.transfers !== undefined && (
            <div className="summary-card">
              <div className="summary-icon transfer-icon">
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
              </div>
              <div>
                <div className="summary-value">{routeData.metadata.transfers}</div>
                <div className="summary-label">
                  {routeData.metadata.transfers === 0
                    ? "Direct"
                    : routeData.metadata.transfers === 1
                    ? "Transfer"
                    : "Transfers"}
                </div>
              </div>
            </div>
          )}
        </div>

        {routeData.metadata?.warning && (
          <div className="warning-message">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 9v4m0 4h.01M4.93 19h14.14c1.45 0 2.37-1.55 1.68-2.83L13.68 4.83c-.69-1.28-2.67-1.28-3.36 0L3.25 16.17C2.56 17.45 3.48 19 4.93 19z"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span>{routeData.metadata.warning}</span>
          </div>
        )}

        <div className="route-steps">
          {routeData.steps.map((step, index) => (
            <RouteStepDetail key={index} step={step} index={index} />
          ))}
        </div>
      </div>
    </>
  );
}

// Component to render visual elements on map
function RouteStepVisual({ step, index }: { step: RouteStep; index: number }) {
  // Draw polyline for walk or bus segments
  if (step.polyline && step.polyline.length > 0) {
    return (
      <Polyline
        positions={step.polyline}
        pathOptions={{
          color: step.color || "#3B82F6",
          weight: 4,
          opacity: 0.8,
          dashArray: step.type === "walk" ? "10, 10" : undefined,
        }}
      />
    );
  }

  // Show marker for transfer or arrival points
  if (step.location && (step.action === "transfer" || step.action === "arrive")) {
    return (
      <Marker position={step.location} icon={busStopIcon}>
        <Popup>
          <div>
            <strong>{step.action === "transfer" ? "Transfer" : "Arrival"}</strong>
            <br />
            {step.at}
            {step.action === "transfer" && step.to && (
              <>
                <br />
                Change to {step.to}
              </>
            )}
          </div>
        </Popup>
      </Marker>
    );
  }

  // Show real-time bus positions
  if (step.buses_available && step.buses_available.length > 0) {
    return (
      <>
        {step.buses_available.map((bus, busIndex) => {
          // Find the stop position from stops_between
          // This is a simplified version - you might need to fetch actual coordinates
          return null; // Would need stop coordinates to show bus position
        })}
      </>
    );
  }

  return null;
}

// Component to render step details in the panel
function RouteStepDetail({ step, index }: { step: RouteStep; index: number }) {
  if (step.action === "walk") {
    return (
      <div className="route-step walk-step">
        <div className="step-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"
              fill="#6B7280"
            />
          </svg>
        </div>
        <div className="step-content">
          <div className="step-title">
            Walk {step.distance ? `${step.distance.toFixed(2)} km` : ""}
          </div>
          <div className="step-details">
            {step.from && <div>From: {step.from}</div>}
            {step.to && <div>To: {step.to}</div>}
            {step.duration && <div>{step.duration} minutes</div>}
          </div>
        </div>
      </div>
    );
  }

  if (step.action === "board") {
    return (
      <div className="route-step board-step">
        <div className="step-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C8 2 4 2.5 4 6v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zm0 2c3.51 0 5.96.48 6.93 1.5H5.07C6.04 4.48 8.49 4 12 4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
              fill="#4338CA"
            />
          </svg>
        </div>
        <div className="step-content">
          <div className="step-title" style={{ color: step.color }}>
            Board {step.line}
          </div>
          <div className="step-details">At: {step.at}</div>
        </div>
      </div>
    );
  }

  if (step.action === "travel") {
    return (
      <div className="route-step travel-step">
        <div
          className="step-icon"
          style={{ backgroundColor: step.color, borderRadius: "50%" }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C8 2 4 2.5 4 6v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4z"
              fill="white"
            />
          </svg>
        </div>
        <div className="step-content">
          <div className="step-title" style={{ color: step.color }}>
            Ride {step.line} ({step.stops} stops)
          </div>
          <div className="step-details">
            {step.duration && <div>{step.duration} minutes</div>}
            {step.distance && <div>{step.distance.toFixed(1)} km</div>}
          </div>
          {step.stops_between && step.stops_between.length > 0 && (
            <details className="stops-list">
              <summary>View all stops</summary>
              <ul>
                {step.stops_between.map((stop, i) => (
                  <li key={i}>{stop}</li>
                ))}
              </ul>
            </details>
          )}
          {step.buses_available && step.buses_available.length > 0 && (
            <div className="buses-info">
              <strong>Buses nearby:</strong>
              {step.buses_available.map((bus, i) => (
                <div key={i} className="bus-info">
                  🚌 {bus.bus_number} - {bus.stops_away} stop
                  {bus.stops_away !== 1 ? "s" : ""} away (ETA: {bus.eta_minutes}{" "}
                  min)
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step.action === "transfer") {
    return (
      <div className="route-step transfer-step">
        <div className="step-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 10l5 5 5-5M7 14l5 5 5-5"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="step-content">
          <div className="step-title" style={{ color: "#f59e0b" }}>
            Transfer
          </div>
          <div className="step-details">
            <div>At: {step.at}</div>
            <div>Change to: {step.to}</div>
          </div>
        </div>
      </div>
    );
  }

  if (step.action === "arrive") {
    return (
      <div className="route-step arrive-step">
        <div className="step-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill="#10b981"
            />
            <circle cx="12" cy="9" r="2.5" fill="white" />
          </svg>
        </div>
        <div className="step-content">
          <div className="step-title" style={{ color: "#10b981" }}>
            Arrive at destination
          </div>
          <div className="step-details">{step.at}</div>
        </div>
      </div>
    );
  }

  return null;
}