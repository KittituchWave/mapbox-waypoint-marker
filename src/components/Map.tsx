import React, { useState } from "react";
import Map, { NavigationControl, ViewState } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN; // Access environment variable

const MapComponent: React.FC = () => {
  const [viewport, setViewport] = useState<ViewState>({
    latitude: 13.7563, // Latitude for Bangkok
    longitude: 100.5018, // Longitude for Bangkok
    zoom: 10, // Adjust zoom level as needed
    bearing: 0,
    pitch: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  return (
    <div className="w-full h-screen">
      <Map
        initialViewState={viewport}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/satellite-v9"
        onMove={(evt) => setViewport(evt.viewState)}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />
      </Map>
    </div>
  );
};

export default MapComponent;
