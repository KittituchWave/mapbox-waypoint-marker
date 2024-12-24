import React, { useState } from "react";
import Map, {
  Marker,
  Source,
  Layer,
  LayerProps,
  MapMouseEvent, // Updated type from MapLayerMouseEvent to MapMouseEvent
  MarkerDragEvent,
  NavigationControl,
} from "react-map-gl";
import { Edit, Move, List, Trash2 } from "lucide-react"; // Import icons for UI controls
import "mapbox-gl/dist/mapbox-gl.css"; // Import Mapbox styles

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN; // Use your Mapbox token (stored in .env file)

// Define the Waypoint type for markers
type Waypoint = {
  id: number; // Unique ID for each marker
  latitude: number; // Latitude of the marker
  longitude: number; // Longitude of the marker
};

const MapView: React.FC = () => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]); // Markers
  const [isPlacingMode, setIsPlacingMode] = useState<boolean>(true); // Mode toggle
  const [showCoordinates, setShowCoordinates] = useState<boolean>(false); // Toggle coordinates
  const [draggingMarkerId, setDraggingMarkerId] = useState<number | null>(null); // Track dragging marker
  const [popupMarkerId, setPopupMarkerId] = useState<number | null>(null); // Marker with visible delete button

  // Add a new marker at the clicked position (only in Placing Mode)
  const handleMapClick = (event: MapMouseEvent) => {
    // Updated type here
    if (isPlacingMode) {
      const { lng, lat } = event.lngLat; // Get latitude and longitude from the click event
      const newWaypoint: Waypoint = {
        id: waypoints.length + 1, // Assign a unique ID based on the current number of markers
        latitude: lat,
        longitude: lng,
      };
      setWaypoints((prev) => [...prev, newWaypoint]); // Add the new marker to the list
    }
  };

  // Update marker position during dragging
  const handleDrag = (id: number, event: MarkerDragEvent) => {
    setWaypoints((prev) =>
      prev.map(
        (waypoint) =>
          waypoint.id === id
            ? {
                ...waypoint,
                latitude: event.lngLat.lat, // Update latitude
                longitude: event.lngLat.lng, // Update longitude
              }
            : waypoint // Keep other markers unchanged
      )
    );
  };

  // Mark a marker as being dragged
  const handleDragStart = (id: number) => {
    setDraggingMarkerId(id); // Set the ID of the marker being dragged
  };

  // Stop tracking drag state after dragging ends
  const handleDragEnd = () => {
    setDraggingMarkerId(null); // Clear the dragging state
  };

  // Show delete button when right-clicking a marker
  const handleMarkerContextMenu = (id: number, event: React.MouseEvent) => {
    event.preventDefault(); // Prevent the browser's default right-click menu
    setPopupMarkerId(id); // Show the delete button for the right-clicked marker
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
    id: "flight-path", // Unique ID for the polyline layer
    type: "line", // Line type
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
              } // Show delete button on right-click
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
          onClick={() => setIsPlacingMode(!isPlacingMode)} // Toggle between Placing and Dragging Mode
          className={`p-3 rounded-lg shadow-md ${
            isPlacingMode
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-gray-500 hover:bg-gray-600"
          }`}
        >
          {isPlacingMode ? (
            <Move className="text-white w-6 h-6" /> // Move icon for Placing Mode
          ) : (
            <Edit className="text-white w-6 h-6" /> // Edit (Pen) icon for Dragging Mode
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
    </div>
  );
};

export default MapView;
