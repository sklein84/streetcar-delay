from typing import List

from fastapi import FastAPI

from streetcardelay import config
from streetcardelay.api.model import StreetCarDelay, StreetCarDelayAggregate
from streetcardelay.processing import DataKraken


def prepare_data():
    data_kraken = DataKraken()
    data_kraken.read_delay_data(config.DELAY_DATA_FILE)
    data_kraken.add_geocoded_delay_locations_from_file(config.DELAY_COORDINATES_FILE)
    data_kraken.read_stops_data(config.STREETCAR_STOPS_DIRECTORY)
    data_kraken.add_nearest_stop_locations()

    if data_kraken.delay_data is None or data_kraken.stops is None:
        raise ValueError

    return data_kraken.stops, data_kraken.delay_data


STREETCAR_STOPS, DELAY_DATA = prepare_data()

app = FastAPI()


@app.get("/streetcarLines")
async def streetcar_lines() -> List[str]:
    return list(STREETCAR_STOPS)


@app.get("/streetcarStops")
async def streetcar_stops(line: str) -> List[str]:
    return STREETCAR_STOPS[line]["stops"]


@app.get("/streetcarDelays/{line}", response_model_by_alias=False)
async def streetcar_delays(line) -> List[StreetCarDelay]:
    return (
        DELAY_DATA[DELAY_DATA.Line == line]
        .replace(float("nan"), None)
        .to_dict("records")
    )


@app.get("/streetcarDelays/{line}/aggregate", response_model_by_alias=False)
async def streetcar_delay_aggregate(line) -> List[StreetCarDelayAggregate]:
    aggregated = (
        DELAY_DATA[DELAY_DATA.Line == line][
            ["closest_stop_before", "closest_stop_after", "Min Delay"]
        ]
        .groupby(["closest_stop_before", "closest_stop_after"])
        .agg(["sum", "count"])
    )
    aggregated.columns = [
        "_".join(col).rstrip("_") for col in aggregated.columns.values
    ]

    aggregated.reset_index(inplace=True)

    return aggregated.to_dict("records")
