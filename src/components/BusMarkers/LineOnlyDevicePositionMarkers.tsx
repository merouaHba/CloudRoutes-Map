import { useQueryClient } from "@tanstack/react-query";
import { useDevicePosition } from "../../hooks/use-device-position.ts";
import { useCallback, useRef } from "react";
import { Device, DeviceEvent, MapFilters, PositionEvent } from "../../types.ts";
import { capitalize, isPositionEvent } from "../../helpers.ts";
import { useDevicePositionListener } from "../../hooks/use-device-position-listener.ts";
import { Marker, Popup } from "react-leaflet";
import { busIcon } from "../../icons.ts";
import { useLines } from "@cloudroutes/query/lines";
import { Line } from "@cloudroutes/core/lines";
import { useFilterStore } from "../../hooks/use-filter-store.ts";
import { isEmpty } from "@cloudroutes/core";
import { Marker as LeafletMarker } from "leaflet";

function BusMarkerWithHoverPopup({
  device,
  position,
}: {
  device: Device;
  position: { latitude: number; longitude: number; course: number };
}) {
  const markerRef = useRef<LeafletMarker>(null);

  return (
    <Marker
      ref={markerRef}
      position={[position.latitude, position.longitude]}
      icon={busIcon( position.course)}
      title={device?.name ?? "Unknown"}
      zIndexOffset={1000}
      eventHandlers={{
        mouseover: () => {
          markerRef.current?.openPopup();
        },
        mouseout: () => {
          markerRef.current?.closePopup();
        },
      }}
    >
      <Popup>
        {capitalize(device?.category || "bus")} - {device?.name ?? "Unknown"}
      </Popup>
    </Marker>
  );
}

export function LineOnlyDevicePositionMarkers() {
  const filters = useFilterStore((state) => state.filters);
  const queryClient = useQueryClient();
  const [positions, devices] = useDevicePosition();
  const { data: lines } = useLines();

  const onPositionUpdate = useCallback(
    (e: MessageEvent<string>) => {
      const event = JSON.parse(e.data) as PositionEvent | DeviceEvent;

      if (isPositionEvent(event)) {
        const updated = positions.data?.map((p) => {
          const update = event.positions.find(
            (pos) => pos.deviceId === p.deviceId
          );

          return update
            ? {
                ...p,
                latitude: update.latitude,
                longitude: update.longitude,
                course: update.course,
              }
            : p;
        });

        if (updated) {
          queryClient.setQueryData(["positions"], updated);
        }
      }
    },
    [queryClient, positions.data]
  );

  useDevicePositionListener(onPositionUpdate);

  if (!positions?.data || !devices?.data || !lines) return <></>;

  const filteredDevices = filteredDevicesData(devices.data, lines, filters);

  return filteredDevices.map((device) => {
    const position = positions.data.find((p) => p.deviceId === device.id);

    if (!position) return null;

    return (
      <BusMarkerWithHoverPopup
        key={device.id + "_" + position.latitude + "_" + position.longitude}
        device={device}
        position={position}
      />
    );
  });
}

function filteredDevicesData(
  devices: Device[],
  lines: Line[],
  filters: MapFilters
): Device[] {
  if (filters.line === "none") return [];
  if (filters.line === "all") return devices;
  const busesIds: string[] = [];

  lines
    .filter((line) => filters.line.includes(line.name))
    .forEach((line) => {
      line.buses.forEach((bus) => {
        if (
          !isEmpty(bus.traccar_device_id) &&
          !busesIds.includes(bus.traccar_device_id)
        ) {
          busesIds.push(bus.traccar_device_id);
        }
      });
    });

  return devices.filter((device) => busesIds.includes(device.uniqueId));
}
