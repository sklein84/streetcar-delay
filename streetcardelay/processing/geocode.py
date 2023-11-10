from concurrent.futures import ThreadPoolExecutor
from time import sleep, time
from typing import Dict, Iterable, Tuple

import requests

from streetcardelay.config import GEOCODE_URL, GOOGLE_MAPS_API_KEY, TORONTO_BOUNDING_BOX


def geocode_location_gmaps(
    location_description: str, bounding_box=TORONTO_BOUNDING_BOX
) -> Tuple[float, float]:
    """Turn a location description into a lattitude-longitude coordinate pair using the
    Google Maps geocoding API
    """

    geocode = requests.get(
        GEOCODE_URL,
        params={
            "address": location_description.replace("/", "&").replace("@", "at"),
            "bounds": bounding_box,
            "key": GOOGLE_MAPS_API_KEY,
        },
    )

    geocode.raise_for_status()
    if not geocode.json()["results"]:
        return float("nan"), float("nan")

    coords = geocode.json()["results"][0]["geometry"]["location"]

    return coords["lat"], coords["lng"]


def geocode_all_locations(
    descriptions: Iterable[str],
    bounding_box=TORONTO_BOUNDING_BOX,
    query_batch_size: int = 1000,
    cooldown_period: int = 30,
) -> Dict[str, Tuple[float, float]]:
    """Turn an iterable of location descriptions into a dictionary of descriptions to
    lattitude-longitude coordinates. Uses a thread pool to query the Google Maps geocoding API and
    tries to avoid hitting rate limits.
    """
    descriptions = list(descriptions)
    chunks = [
        descriptions[(i * query_batch_size) : (i + 1) * query_batch_size]
        for i in range((len(descriptions) // query_batch_size) + 1)
    ]

    all_results = {}
    execution_start = time()
    for i, chunk in enumerate(chunks):
        with ThreadPoolExecutor() as executor:
            futures = [
                executor.submit(geocode_location_gmaps, description, bounding_box)
                for description in chunk
            ]
            chunk_results = {
                description: future.result() for description, future in zip(chunk, futures)
            }
        all_results.update(chunk_results)

        execution_end = time()
        if (duration := (execution_end - execution_start)) < cooldown_period:
            if i < len(chunks) - 1:  # Don't cool down after last chunk
                sleep(cooldown_period - duration)
        execution_start = execution_end

    return all_results
