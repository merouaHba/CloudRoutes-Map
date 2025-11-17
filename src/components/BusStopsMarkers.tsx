import { useStops } from "@cloudroutes/query/lines";
import { QUERY_KEYS } from "@cloudroutes/query";
import { LatLngExpression } from "leaflet";
import { busStopIcon } from "../icons.ts";
import { Marker, Popup } from "react-leaflet";
import { useFilterStore } from "../hooks/use-filter-store.ts";
import { MapFilters } from "../types.ts";
import React from "react";
import { useTranslation } from "react-i18next";

type StopMarker = {
  id: number;
  title: string;
  coordinate: LatLngExpression;
  lines: string[];
};

function BusStopPopupContent({
  stop,
  onSetAsStart,
  onSetAsDestination,
}: {
  stop: StopMarker;
  onSetAsStart?: () => void;
  onSetAsDestination?: () => void;
}) {
  const { t } = useTranslation();
  const [isLoadingRoute, setIsLoadingRoute] = React.useState(false);
  const [isLoadingTimes, setIsLoadingTimes] = React.useState(false);

  const handleRouteClick = () => {
    setIsLoadingRoute(true);
    if (onSetAsDestination) {
      onSetAsDestination();
    }
    setTimeout(() => setIsLoadingRoute(false), 1000);
  };

  const handleTimesClick = () => {
    setIsLoadingTimes(true);
    // Your times logic here
    setTimeout(() => setIsLoadingTimes(false), 1000);
  };

  return (
    <div>
      <div className="popup-header">
        <div className="popup-icon">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill="#0c4a6e"
            />
            <circle cx="12" cy="9" r="2.5" fill="white" />
          </svg>
        </div>
        <div className="popup-title">{stop.title}</div>
      </div>
      <div className="popup-body">
        <div className="popup-info-row">
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
          <div>
            <span className="popup-info-label">{t("bus_stop.lines")}:</span>{" "}
            {stop.lines.join(", ")}
          </div>
        </div>
        <div className="popup-divider"></div>
        <div className="popup-info-row">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C8 2 4 2.5 4 6v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4z"
              fill="currentColor"
            />
          </svg>
          <div>
            <span className="popup-info-label">{t("bus_stop.type")}:</span>{" "}
            {t("bus_stop.title")}
          </div>
        </div>
      </div>
      <div className="popup-actions">
        <button
          className="popup-button popup-button-primary"
          onClick={handleRouteClick}
          disabled={isLoadingRoute}
        >
          {isLoadingRoute ? (
            <>
              <div className="spinner-small"></div>
              <span>{t("bus_stop.loading")}</span>
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="10"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <span>{t("bus_stop.view_route")}</span>
            </>
          )}
        </button>
        <button
          className="popup-button popup-button-secondary"
          onClick={handleTimesClick}
          disabled={isLoadingTimes}
        >
          {isLoadingTimes ? (
            <>
              <div
                className="spinner-small"
                style={{
                  borderColor: "rgba(67, 56, 202, 0.3)",
                  borderTopColor: "#0c4a6e",
                }}
              ></div>
              <span>{t("bus_stop.loading")}</span>
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
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
              <span>{t("bus_stop.view_times")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function BusStopsMarkers() {
  const filters = useFilterStore((state) => state.filters);

  const { data: stops } = useStops<StopMarker[]>({
    queryKey: [QUERY_KEYS.STOPS],
    select: (data) => {
      return data.map((stop) => {
        return {
          id: stop.id,
          title: stop.name,
          coordinate: [parseFloat(stop.latitude), parseFloat(stop.longitude)],
          lines: stop.lines.map((line) => line.name),
        };
      });
    },
  });

  if (!stops || filters.stop === "none") return <></>;

  const filteredStops = filteredStopsData(stops, filters);

  return (
    <>
      {filteredStops.map((stop) => (
        <Marker
          key={stop.id}
          position={stop.coordinate}
          icon={busStopIcon}
          title={stop.title}
        >
          <Popup>
            <BusStopPopupContent stop={stop} />
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function filteredStopsData(
  stops: StopMarker[],
  filters: MapFilters
): StopMarker[] {
  if (filters.stop === "all" || filters.line === "all") return stops;
  if (filters.line === "none" && filters.stop === "line-only") return [];

  if (Array.isArray(filters.line) && filters.stop === "line-only") {
    return stops.filter((stop) =>
      stop.lines.some((line) => filters.line.includes(line))
    );
  }

  return stops;
}
