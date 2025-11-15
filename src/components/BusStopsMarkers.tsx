import { useStops } from "@cloudroutes/query/lines";
import { QUERY_KEYS } from "@cloudroutes/query";
import { LatLngExpression } from "leaflet";
import { busStopIcon } from "../icons.ts";
import { Marker, Popup } from "react-leaflet";
import { useFilterStore } from "../hooks/use-filter-store.ts";
import { MapFilters } from "../types.ts";

type StopMarker = {
  id: number;
  title: string;
  coordinate: LatLngExpression;
  lines: string[];
};

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

  return filteredStops.map((stop) => (
    <Marker
      key={stop.id}
      position={stop.coordinate}
      icon={busStopIcon}
      title={stop.title}
    >
      <Popup>{stop.title}</Popup>
    </Marker>
  ));
}

function filteredStopsData(
  stops: StopMarker[],
  filters: MapFilters,
): StopMarker[] {
  if (filters.stop === "all" || filters.line === "all") return stops;
  if (filters.line === "none" && filters.stop === "line-only") return [];

  if (Array.isArray(filters.line) && filters.stop === "line-only") {
    return stops.filter((stop) =>
      stop.lines.some((line) => filters.line.includes(line)),
    );
  }

  return stops;
}
