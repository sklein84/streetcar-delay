import datetime
import logging
import re
from itertools import chain
from pathlib import Path
from typing import Dict, List, Tuple, Union

import numpy as np
import pandas as pd

from streetcardelay.processing.delay_data_downloader import DelayDataDownloader
from streetcardelay.processing.geocode import geocode_all_locations
from streetcardelay.processing.spatial import find_closest_stop_pair

logger = logging.getLogger(__name__)


class DataKraken:
    """Class that helps with obtaining TTC streetcar delay data and orchestrates preprocessing.

    Attributes:
        delay_data: holds tabular delay incident data; can be populated by calling the methods
                    download_delay_data to obtain it directly from the TTC source or by calling
                    read_delay_data to read a csv file
        stops: holds streetcar stop data; can be populated by calling the method read_stops_data,
               which reads csv files with stop names and locations
    """

    delay_data: Union[pd.DataFrame, None]
    stops: Union[Dict[str, Dict[str, List]], None]

    expected_source_columns = {
        "Date": str,
        "Line": str,
        "Time": str,
        "Day": str,
        "Location": str,
        "Incident": str,
        "Min Delay": np.float64,
        "Min Gap": np.float64,
        "Bound": str,
        "Vehicle": str,
    }
    float_tuple_regexp = re.compile(r"\((-?\d+\.\d+), (-?\d+\.\d+)\)")

    def __init__(self) -> None:
        self.delay_data = None
        self.stops = None

    def download_delay_data(self):
        """Downloads streetcar delay incident data from TTC sources"""
        self.delay_data = DelayDataDownloader.get_all_data()

    def read_delay_data(self, fp: Path):
        """Reads streetcat delay incident data from specified csv file"""
        self.delay_data = pd.read_csv(fp, sep="|")

        if not set(self.expected_source_columns) <= set(self.delay_data.columns):
            logger.warn(
                "Missing columns in provided data: %s",
                set(self.expected_source_columns) - set(self.delay_data.columns),
            )

        self.delay_data = self.delay_data.astype(dtype=self.expected_source_columns)
        self.delay_data["Date"] = pd.to_datetime(self.delay_data["Date"])
        self.delay_data["Time"] = self.delay_data["Time"].map(datetime.time.fromisoformat)

    def add_geocoded_delay_locations_from_file(self, fp: Path):
        """Add coordindates to delay incident data using a csv file with location names and
        coordinates
        """
        if self.delay_data is None:
            raise ValueError("No delay data found")

        geocoded_delay_locations = pd.read_csv(fp, sep="|")
        geocoded_delay_locations.coordinates = geocoded_delay_locations.coordinates.map(
            self._tuple_parser
        )

        self.delay_data = self.delay_data.merge(
            geocoded_delay_locations,
            how="left",
            left_on=self.delay_data.Location.str.upper(),
            right_on=geocoded_delay_locations.delay_location.str.upper(),
        ).drop("delay_location", axis=1)

        self.delay_data.loc[self.delay_data.coordinates.isna(), "coordinates"] = None

    def geocode_delay_data(self):
        """Use the Google Maps geocoding API to obtain coordinates for the specified locations
        in the delay incident data
        """
        if self.delay_data is None:
            raise ValueError("No delay data found")
        self.delay_data = DelayDataDownloader.geocode_locations(self.delay_data)

    def add_nearest_stop_locations(self):
        """For all delay incidents, add the closest streetcar stop before and after the incident
        location
        """
        if self.delay_data is None:
            raise ValueError("No delay data found")
        if self.stops is None:
            raise ValueError("No streetcar stop data found")

        self.delay_data["closest_stop_before"] = None
        self.delay_data["closest_stop_after"] = None
        for row in self.delay_data.itertuples():
            if (row.coordinates is None) or (row.Line not in self.stops):
                continue
            line = self.stops[row.Line]
            closest_stop_pair_before_index = find_closest_stop_pair(
                line["coordinates"], row.coordinates
            )
            self.delay_data.loc[row[0], "closest_stop_before"] = line["stops"][
                closest_stop_pair_before_index
            ]
            self.delay_data.loc[row[0], "closest_stop_after"] = line["stops"][
                closest_stop_pair_before_index + 1
            ]

    @classmethod
    def _tuple_parser(cls, tuple_string: str) -> Union[None, Tuple[float, float]]:
        """Parse a tuple of floats from a string"""
        match = cls.float_tuple_regexp.match(tuple_string)
        if not match:
            return None
        return float(match[1]), float(match[2])

    def read_stops_data(self, stops_directory: Path, glob="*_stops*.csv"):
        """Read streetcar stops data from csv files in specified stops directory; glob specifies
        the pattern that should be used to identify the correct files in the directory
        """
        stops_coordinates = {}
        for fp in sorted(stops_directory.glob(glob)):
            stops = pd.read_csv(fp, sep="|")
            stops.coordinates = stops.coordinates.apply(self._tuple_parser)
            streetcar_line_match = re.match(r"\d{3}", str(fp.stem))
            if not streetcar_line_match:
                raise ValueError(f"Could not extract streetcar line number from filename {fp}")

            stops_coordinates[streetcar_line_match[0]] = {"stops": stops["stop"].to_list()}

            if "coordinates" in stops.columns:
                stops_coordinates[streetcar_line_match[0]]["coordinates"] = stops[
                    "coordinates"
                ].to_list()
            else:
                stops_coordinates[streetcar_line_match[0]]["coordinates"] = []
                logger.warn("File %s does not contain coordinates of streetcar stops", fp)

        self.stops = stops_coordinates

    def geocode_stop_locations(self):
        """Use the Google Maps geocoding API to obtain coordinates for all stop locations"""
        if not self.stops:
            raise ValueError("No stop data found")

        stop_descriptions = set(chain.from_iterable(val["stops"] for val in self.stops.values()))

        logger.info("Geocoding %s streetcar stop descriptions", len(stop_descriptions))
        geocoded = geocode_all_locations(stop_descriptions)

        for line, data in self.stops.items():
            self.stops[line]["coordinates"] = [
                geocoded[description] for description in data["stops"]
            ]
