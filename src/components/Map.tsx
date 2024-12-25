import React, { useState } from "react";
import Map, {
  Marker,
  Source,
  Layer,
  LayerProps,
  MapMouseEvent,
  MarkerDragEvent,
  NavigationControl,
} from "react-map-gl";
import { Edit, Move, List, Trash2 } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

type Waypoint = {
  id: number;
  latitude: number;
  longitude: number;
};

const MapView: React.FC = () => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]); // Markers
  const [isPlacingMode, setIsPlacingMode] = useState<boolean>(true); // Mode toggle
  const [showCoordinates, setShowCoordinates] = useState<boolean>(false); // Toggle coordinates
  const [draggingMarkerId, setDraggingMarkerId] = useState<number | null>(null); // Track dragging marker
  const [popupMarkerId, setPopupMarkerId] = useState<number | null>(null); // Marker with visible delete button
  const [modeMessage, setModeMessage] = useState<string | null>(null); // Temporary mode message

  // Show a temporary message when switching modes
  const showModeMessage = (message: string) => {
    setModeMessage(message);
    setTimeout(() => setModeMessage(null), 3000); // Hide after 3 seconds
  };

  // Toggle between Placing Mode and Dragging Mode
  const toggleMode = () => {
    const newMode = !isPlacingMode;
    setIsPlacingMode(newMode);
    showModeMessage(newMode ? "Placing Mode" : "Dragging Mode"); // Show mode message
  };

  // Add a new marker at the clicked position (only in Placing Mode)
  const handleMapClick = (event: MapMouseEvent) => {
    // Reset the popupMarkerId when clicking on the map
    setPopupMarkerId(null);

    if (isPlacingMode) {
      const { lng, lat } = event.lngLat;
      const newWaypoint: Waypoint = {
        id: waypoints.length + 1,
        latitude: lat,
        longitude: lng,
      };
      setWaypoints((prev) => [...prev, newWaypoint]);
    }
  };

  // Update marker position during dragging
  const handleDrag = (id: number, event: MarkerDragEvent) => {
    setWaypoints((prev) =>
      prev.map((waypoint) =>
        waypoint.id === id
          ? {
              ...waypoint,
              latitude: event.lngLat.lat, // Update latitude
              longitude: event.lngLat.lng, // Update longitude
            }
          : waypoint
      )
    );
  };

  // Mark a marker as being dragged
  const handleDragStart = (id: number) => {
    setDraggingMarkerId(id);
  };

  // Stop tracking drag state after dragging ends
  const handleDragEnd = () => {
    setDraggingMarkerId(null);
  };

  // Show or hide the delete button when right-clicking a marker
  const handleMarkerContextMenu = (id: number, event: React.MouseEvent) => {
    event.preventDefault(); // Prevent the default right-click menu

    // Toggle the delete button for the right-clicked marker
    setPopupMarkerId((prev) => (prev === id ? null : id));
  };

  // Delete a marker and renumber the remaining markers
  const deleteMarker = (id: number) => {
    setWaypoints(
      (prev) =>
        prev
          .filter((waypoint) => waypoint.id !== id) // Remove the marker with the given ID
          .map((waypoint, index) => ({ ...waypoint, id: index + 1 })) // Renumber remaining markers sequentially
    );
    setPopupMarkerId(null); // Hide the delete button after deletion
  };

  // GeoJSON data for the polyline connecting the markers
  const geojson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: waypoints.map((wp) => [wp.longitude, wp.latitude]), // Connect markers in sequence
        },
      },
    ],
  };

  // Style for the polyline
  const lineLayerStyle: LayerProps = {
    id: "flight-path",
    type: "line",
    paint: {
      "line-color": "#00bcd4", // Cyan color for the line
      "line-width": 4, // Line thickness
    },
  };

  return (
    <div className="w-full h-screen relative">
      {/* Main Map Component */}
      <Map
        initialViewState={{
          latitude: 13.7563, // Initial latitude (Bangkok center)
          longitude: 100.5018, // Initial longitude (Bangkok center)
          zoom: 16, // Initial zoom level
        }}
        mapStyle="mapbox://styles/mapbox/satellite-v9" // Mapbox satellite style
        mapboxAccessToken={MAPBOX_TOKEN} // Access token for Mapbox API
        style={{ width: "100%", height: "100%" }} // Fullscreen map
        onClick={handleMapClick} // Handle map clicks to add markers
      >
        {/* Polyline connecting markers */}
        <Source id="flight-path" type="geojson" data={geojson}>
          <Layer {...lineLayerStyle} />
        </Source>

        {/* Render markers */}
        {waypoints.map((waypoint) => (
          <Marker
            key={waypoint.id}
            latitude={waypoint.latitude}
            longitude={waypoint.longitude}
            draggable={!isPlacingMode} // Allow dragging only in Dragging Mode
            onDragStart={() => handleDragStart(waypoint.id)} // Handle drag start
            onDrag={(event) => handleDrag(waypoint.id, event)} // Handle dragging
            onDragEnd={handleDragEnd} // Handle drag end
          >
            {/* Marker content */}
            <div
              onContextMenu={(event) =>
                handleMarkerContextMenu(waypoint.id, event)
              } // Show or hide delete button on right-click
              className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                draggingMarkerId === waypoint.id
                  ? "border-blue-700 bg-blue-600 shadow-lg shadow-blue-500/50" // Glow effect when dragging
                  : isPlacingMode
                  ? "border-black bg-white" // White marker in Placing Mode
                  : "border-blue-600 bg-blue-100" // Blue marker in Dragging Mode
              } ${isPlacingMode ? "cursor-not-allowed" : "cursor-grab"}`}
            >
              <span className="text-xs font-bold text-black">
                {waypoint.id} {/* Display marker ID */}
              </span>
            </div>

            {/* Delete button (visible for the selected marker) */}
            {popupMarkerId === waypoint.id && (
              <div
                className="absolute top-10 left-4 flex items-center bg-red-500 text-white p-1 rounded shadow-lg cursor-pointer"
                onClick={() => deleteMarker(waypoint.id)}
              >
                <Trash2 className="w-4 h-4 mr-1" /> {/* Trash icon */}
                Delete
              </div>
            )}
          </Marker>
        ))}

        {/* Map Navigation Control (Zoom and Compass) */}
        <div className="absolute top-4 right-4">
          <NavigationControl />
        </div>
      </Map>

      {/* UI Controls */}
      <div className="absolute top-4 left-4 flex space-x-4">
        {/* Toggle Mode Button */}
        <button
          onClick={toggleMode} // Toggle between Placing and Dragging Mode
          className={`p-3 rounded-lg shadow-md ${
            isPlacingMode
              ? "bg-orange-500 hover:bg-orange-600"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isPlacingMode ? (
            <Edit className="text-white w-6 h-6" /> // Pen icon for Placing Mode
          ) : (
            <Move className="text-white w-6 h-6" /> // Move icon for Dragging Mode
          )}
        </button>

        {/* Clear All Markers Button */}
        <button
          onClick={() => setWaypoints([])} // Clear all markers
          className="p-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600"
        >
          Clear
        </button>

        {/* Toggle Coordinate Box Button */}
        <button
          onClick={() => setShowCoordinates(!showCoordinates)} // Show/Hide coordinate box
          className="p-3 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600"
        >
          <List className="text-white w-6 h-6" /> {/* List icon */}
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

      {/* Mode Notification */}
      {modeMessage && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded shadow-lg">
          {modeMessage}
        </div>
      )}
    </div>
  );
};

export default MapView;
