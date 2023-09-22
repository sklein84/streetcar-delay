from unittest.mock import patch
from uuid import uuid4

from streetcardelay.processing.geocode import geocode_all_locations


@patch(
    "streetcardelay.processing.geocode.geocode_location_gmaps",
    new=lambda x, y=None: (1, 2),
)
def test_geocode_all_locations():
    descriptions = [str(uuid4()) for _ in range(567)]
    result = geocode_all_locations(descriptions, query_batch_size=31, cooldown_period=0)

    assert len(result) == len(descriptions)
