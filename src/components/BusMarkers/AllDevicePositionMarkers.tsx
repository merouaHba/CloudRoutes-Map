import { useQueryClient } from "@tanstack/react-query";
import { useDevicePosition } from "../../hooks/use-device-position.ts";
import { useCallback } from "react";
import { DeviceEvent, PositionEvent } from "../../types.ts";
import { isPositionEvent } from "../../helpers.ts";
import { useDevicePositionListener } from "../../hooks/use-device-position-listener.ts";
import { Marker } from "react-leaflet";
import { busIcon } from "../../icons.ts";

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

    if (!position) return <></>;

    return (
      <Marker
        key={device.id}
        position={[position.latitude, position.longitude]}
        icon={busIcon( position.course)}
        // title={device?.name ?? "Unknown"}
        zIndexOffset={1000}
      >
        {/* <Popup>
          {capitalize(device?.category || "bus")} - {device?.name ?? "Unknown"}
        </Popup> */}
      </Marker>
    );
  });
}
