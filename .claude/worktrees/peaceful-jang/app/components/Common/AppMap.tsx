"use client";

import Map, { Marker, Source, Layer, type LineLayer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { HiMapPin } from "react-icons/hi2";
import type { Feature, LineString } from "geojson";

type MapProps = {
  latitude: number;
  longitude: number;
  routeCoordinates?: [number, number][]; // [lng, lat]
  width?: number | string;              // ✅ הוסף
  height?: number | string;
  className?: string;
};

const AppMap = ({
  latitude,
  longitude,
  routeCoordinates,
  width = "100%",          // ✅ ברירת מחדל
  height = 320,
  className,
}: MapProps) => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const geojson: Feature<LineString> | null = routeCoordinates
    ? {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: routeCoordinates },
      }
    : null;

  const routeLayer: LineLayer = {
    id: "route",
    type: "line",
    paint: {
      "line-color": "#16a34a",
      "line-width": 4,
      "line-dasharray": [2, 1],
    },
  };

  return (
    <div
      className={`overflow-hidden rounded-xl shadow-inner border border-slate-200 ${className ?? ""}`}
      style={{ width }} // ✅ מאפשר גם width מספרי/מחרוזת
    >
      <Map
        mapboxAccessToken={token}
        initialViewState={{ latitude, longitude, zoom: 14 }}
        style={{ width: "100%", height }} // המפה תמיד ממלאת את הקונטיינר
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        <Marker latitude={latitude} longitude={longitude} anchor="bottom">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-10 w-10 animate-ping rounded-full bg-green-500/20" />
            <HiMapPin size={32} className="text-green-600 drop-shadow-md" />
          </div>
        </Marker>

        {geojson && (
          <Source id="route" type="geojson" data={geojson}>
            <Layer {...routeLayer} />
          </Source>
        )}
      </Map>
    </div>
  );
};

export default AppMap;
