import { useQueryClient } from "@tanstack/react-query";
import { useDevicePosition } from "../../hooks/use-device-position.ts";
import { useCallback, useRef } from "react";
import { DeviceEvent, PositionEvent } from "../../types.ts";
import { capitalize, isPositionEvent } from "../../helpers.ts";
import { useDevicePositionListener } from "../../hooks/use-device-position-listener.ts";
import { Marker, Popup } from "react-leaflet";
import { busIcon } from "../../icons.ts";
import { Marker as LeafletMarker } from "leaflet";

function BusMarkerWithHoverPopup({ 
  device, 
  position 
}: { 
  device: { id: number; name: string; category: string | null }; 
  position: { latitude: number; longitude: number; course: number } 
}) {
  const markerRef = useRef<LeafletMarker>(null);

  return (
    <Marker
      ref={markerRef}
      position={[position.latitude, position.longitude]}
      icon={busIcon(position.course)}
      zIndexOffset={1000}
     
    >
      <Popup>
        {capitalize(device?.category || "bus")} - {device?.name ?? "Unknown"}
      </Popup>
    </Marker>
  );
}

export function AllDevicePositionMarkers() {
  const queryClient = useQueryClient();
  const [positions, devices] = useDevicePosition();

  const onPositionUpdate = useCallback(
    (e: MessageEvent<string>) => {
      const event = JSON.parse(e.data) as PositionEvent | DeviceEvent;

      if (isPositionEvent(event)) {
        const updated = positions.data?.map((p) => {
          const update = event.positions.find(
            (pos) => pos.deviceId === p.deviceId,
          );

          return update
            ? { ...p, latitude: update.latitude, longitude: update.longitude, course: update.course }
            : p;
        });

        if (updated) {
          queryClient.setQueryData(["positions"], updated);
        }
      }
    },
    [queryClient, positions.data],
  );

  useDevicePositionListener(onPositionUpdate);

  if (!positions?.data || !devices?.data) return <></>;

  return devices.data.map((device) => {
    const position = positions.data.find((p) => p.deviceId === device.id);

    if (!position) return null;

    return (
      <BusMarkerWithHoverPopup
        key={device.id}
        device={device}
        position={position}
      />
    );
  });
}