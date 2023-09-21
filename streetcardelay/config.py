import os
from pathlib import Path

GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY")
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

TORONTO_BOUNDING_BOX = "43.5810245,-79.639219|43.8554579,-79.1168971"

DELAY_DATA_FILE = Path(
    os.environ.get("DELAY_DATA_FILE", "data/delays/source_delay_data.csv")
)
DELAY_COORDINATES_FILE = Path(
    os.environ.get("DELAY_COORDINATES_FILE", "data/delays/geocoded_delay_locations.csv")
)
STREETCAR_STOPS_DIRECTORY = Path(
    os.environ.get("STREETCAR_STOPS_DIRECTORY", "data/streetcar_stops")
)
