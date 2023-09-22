from math import asin, cos, radians, sin, sqrt
from typing import List, Tuple


def haversine(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    """Calculate the great circle distance in kilometers between two points
    on the earth (specified in decimal degrees). See https://stackoverflow.com/a/4913653
    """
    # convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radius of earth in kilometers
    return c * r


def find_closest_stop_pair(
    streetcar_stops: List[Tuple[float, float]], delay_point: Tuple[float, float]
) -> int:
    """Finds the closest two adjacent points in a list of coordinates to a reference point and returns
    the index of the first point in the list of adjacents
    """
    if len(streetcar_stops) < 2:
        raise ValueError("Must pass coordinates of at least two streetcar stops")

    closest_stops = sorted(
        range(len(streetcar_stops)),
        key=lambda idx: haversine(
            streetcar_stops[idx][0],
            streetcar_stops[idx][1],
            delay_point[0],
            delay_point[1],
        ),
    )

    nearest = closest_stops[0]
    if nearest == 0:
        return 0

    if nearest == len(streetcar_stops) - 1:
        return nearest - 1

    index_before_stop = closest_stops.index(nearest - 1)
    index_after_stop = closest_stops.index(nearest + 1)

    if index_before_stop < index_after_stop:
        return nearest - 1
    else:
        return nearest
