import React, { useState } from "react";
import Map, {
  Marker,
  Source,
  Layer,
  LayerProps,
  MarkerDragEvent,
  MapLayerMouseEvent,
} from "react-map-gl";
import { Pointer, Move, List } from "lucide-react"; // Import Lucide icons
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN; // Use your Mapbox token

type Waypoint = {
  id: number;
  latitude: number;
  longitude: number;
};

const WaypointMap: React.FC = () => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]); // Start with no markers
  const [isPlacingMode, setIsPlacingMode] = useState<boolean>(true); // Toggle state for placing vs dragging mode
  const [showCoordinates, setShowCoordinates] = useState<boolean>(false); // Toggle for coordinate box visibility
  const [draggingMarkerId, setDraggingMarkerId] = useState<number | null>(null); // Track the marker being dragged

  // Add a new marker when the map is clicked
  const handleMapClick = (event: MapLayerMouseEvent) => {
    if (isPlacingMode) {
      const { lng, lat } = event.lngLat; // Extract longitude and latitude
      const newWaypoint: Waypoint = {
        id: waypoints.length + 1, // Increment ID
        latitude: lat,
        longitude: lng,
      };
      setWaypoints((prev) => [...prev, newWaypoint]);
    }
  };

  // Update marker position during drag (real-time)
  const handleDrag = (id: number, event: MarkerDragEvent) => {
    setWaypoints((prev) =>
      prev.map((waypoint) =>
        waypoint.id === id
          ? {
              ...waypoint,
              latitude: event.lngLat.lat,
              longitude: event.lngLat.lng,
            }
          : waypoint
      )
    );
  };

  // Set marker as being dragged
  const handleDragStart = (id: number) => {
    setDraggingMarkerId(id);
  };

  // Clear dragging state
  const handleDragEnd = () => {
    setDraggingMarkerId(null);
  };

  // GeoJSON object for the polyline
  const geojson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: waypoints.map((wp) => [wp.longitude, wp.latitude]),
        },
      },
    ],
  };

  // Layer style for the polyline
  const lineLayerStyle: LayerProps = {
    id: "flight-path",
    type: "line",
    paint: {
      "line-color": "#00bcd4",
      "line-width": 4,
    },
  };

  return (
    <div className="w-full h-screen relative">
      <Map
        initialViewState={{
          latitude: 13.7563, // Center on Bangkok
          longitude: 100.5018,
          zoom: 16,
        }}
        mapStyle="mapbox://styles/mapbox/satellite-v9"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
        onClick={handleMapClick} // Add marker on click
      >
        {/* Draw the polyline */}
        <Source id="flight-path" type="geojson" data={geojson}>
          <Layer {...lineLayerStyle} />
        </Source>

        {/* Render markers */}
        {waypoints.map((waypoint) => (
          <Marker
            key={waypoint.id}
            latitude={waypoint.latitude}
            longitude={waypoint.longitude}
            draggable={!isPlacingMode} // Allow dragging only in drag mode
            onDragStart={() => handleDragStart(waypoint.id)} // Start dragging
            onDrag={(event) => handleDrag(waypoint.id, event)} // Update path during drag
            onDragEnd={handleDragEnd} // End dragging
          >
            <div
              className={`w-6 h-6 flex items-center justify-center rounded-full border-2 ${
                draggingMarkerId === waypoint.id
                  ? "border-blue-500 bg-blue-200 shadow-lg shadow-blue-500/50" // Glow effect
                  : "border-black bg-white"
              } ${isPlacingMode ? "cursor-not-allowed" : "cursor-grab"}`}
            >
              {waypoint.id}
            </div>
          </Marker>
        ))}
      </Map>

      {/* UI Buttons */}
      <div className="absolute top-4 left-4 flex space-x-4">
        {/* Toggle Mode Button */}
        <button
          onClick={() => setIsPlacingMode(!isPlacingMode)} // Toggle placing/dragging mode
          className={`p-3 rounded-lg shadow-md ${
            isPlacingMode
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-gray-500 hover:bg-gray-600"
          }`}
        >
          {isPlacingMode ? (
            <Pointer className="text-white w-6 h-6" /> // Place mode icon
          ) : (
            <Move className="text-white w-6 h-6" /> // Drag mode icon
          )}
        </button>

        {/* Clear All Markers Button */}
        <button
          onClick={() => setWaypoints([])} // Clear markers and polyline
          className="p-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600"
        >
          Clear
        </button>

        {/* Show Coordinates Button */}
        <button
          onClick={() => setShowCoordinates(!showCoordinates)} // Toggle coordinate box
          className="p-3 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600"
        >
          <List className="text-white w-6 h-6" />
        </button>
      </div>

      {/* Coordinate Box */}
      {showCoordinates && (
        <div className="absolute bottom-4 left-4 max-h-64 w-80 bg-white border border-gray-300 rounded-lg shadow-lg p-4 overflow-y-auto">
          <h3 className="text-lg font-bold mb-2">Coordinates</h3>
          {waypoints.length > 0 ? (
            waypoints.map((wp) => (
              <div key={wp.id} className="text-sm mb-1">
                <strong>Marker {wp.id}:</strong> Lat {wp.latitude.toFixed(5)},
                Lng {wp.longitude.toFixed(5)}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No markers available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default WaypointMap;
