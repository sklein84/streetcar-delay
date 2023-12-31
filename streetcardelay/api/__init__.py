import datetime
from typing import Any, Dict, List, Tuple, Union

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Response

from streetcardelay import config
from streetcardelay.api.model import (
    AggregateDetails,
    MetaData,
    StreetCarDelay,
    StreetCarDelayAggregate,
)
from streetcardelay.graphics.svg_generator import SVGGenerator
from streetcardelay.processing import DataKraken


def prepare_data() -> Tuple[Dict[str, Any], pd.DataFrame]:
    """Read streetcar stop and delay data data from disk and preprocess"""
    data_kraken = DataKraken()
    data_kraken.read_delay_data(config.DELAY_DATA_FILE)
    data_kraken.add_geocoded_delay_locations_from_file(config.DELAY_COORDINATES_FILE)
    data_kraken.read_stops_data(config.STREETCAR_STOPS_DIRECTORY)
    data_kraken.add_nearest_stop_locations()

    if data_kraken.delay_data is None or data_kraken.stops is None:
        raise ValueError

    return data_kraken.stops, data_kraken.delay_data


STREETCAR_STOPS, DELAY_DATA = prepare_data()

app = FastAPI(
    title="Streetcar Delay Exploration API",
    description="REST API that serves TTC streetcar delay statistics.",
    contact={"name": "Sebastian Klein", "url": "https://sklein.me"},
)


@app.get("/metadata")
async def metadata() -> MetaData:
    """Returns metadata about the delay dataset."""
    min_date = DELAY_DATA.Date.min()
    max_date = DELAY_DATA.Date.max()

    return MetaData(earliestDate=min_date, latestDate=max_date)


@app.get("/streetcarLines")
async def streetcar_lines() -> List[str]:
    "Returns a list of streetcar line names."
    return list(STREETCAR_STOPS)


@app.get("/streetcarStops")
async def streetcar_stops(line: str) -> List[str]:
    """Returns a list of streetcar stop names for the given line."""
    if line not in STREETCAR_STOPS:
        raise HTTPException(400, detail=f"Streetcar line {line} not found")

    return STREETCAR_STOPS[line]["stops"]


@app.get("/streetcarDelays/{line}", response_model_by_alias=False)
async def streetcar_delays(line) -> List[StreetCarDelay]:
    """Returns individual delay incident data for the given streetcar line."""
    return DELAY_DATA[DELAY_DATA.Line == line].replace(float("nan"), None).to_dict("records")


def _filter_delay_data(
    *,
    line: Union[str, None] = None,
    stop_before: Union[str, None] = None,
    date_from: Union[datetime.date, None] = None,
    date_until: Union[datetime.date, None] = None,
    time_from: Union[datetime.time, None] = None,
    time_until: Union[datetime.time, None] = None,
    weekday: Union[int, None] = None,
) -> pd.DataFrame:
    filtered_df = DELAY_DATA
    if line is not None:
        filtered_df = filtered_df[filtered_df["Line"] == line]
    if stop_before is not None:
        filtered_df = filtered_df[filtered_df["closest_stop_before"] == stop_before]
    if date_from is not None:
        filtered_df = filtered_df[filtered_df["Date"] >= np.datetime64(date_from)]
    if date_until is not None:
        filtered_df = filtered_df[filtered_df["Date"] <= np.datetime64(date_until)]
    if time_from is not None:
        filtered_df = filtered_df[filtered_df["Time"] >= time_from]
    if time_until is not None:
        filtered_df = filtered_df[filtered_df["Time"] <= time_until]
    if weekday is not None:
        filtered_df = filtered_df[filtered_df["Date"].map(lambda date: date.weekday == weekday)]

    return filtered_df


@app.get("/streetcarDelays/{line}/aggregate", response_model_by_alias=False)
async def streetcar_delay_aggregate(
    line: str,
    dateFrom: Union[datetime.date, None] = None,
    dateUntil: Union[datetime.date, None] = None,
    timeFrom: Union[datetime.time, None] = None,
    timeUntil: Union[datetime.time, None] = None,
) -> List[StreetCarDelayAggregate]:
    """Retrieves aggregated delay incident statistics for a given streecar line, filtered by the
    specified criteria.
    """
    filtered_df = _filter_delay_data(
        line=line,
        date_from=dateFrom,
        date_until=dateUntil,
        time_from=timeFrom,
        time_until=timeUntil,
    )

    aggregated = (
        filtered_df[["closest_stop_before", "closest_stop_after", "Min Delay"]]
        .groupby(["closest_stop_before", "closest_stop_after"])
        .agg(["sum", "count"])
    )
    aggregated.columns = ["_".join(col).rstrip("_") for col in aggregated.columns.values]

    aggregated.reset_index(inplace=True)

    return aggregated.to_dict("records")


@app.get(
    "/streetcarDelays/{line}/aggregate/{closestStopBefore:path}",
    response_model_by_alias=False,
)
async def stop_aggregate_details(
    line: str,
    closestStopBefore: str,
    dateFrom: Union[datetime.date, None] = None,
    dateUntil: Union[datetime.date, None] = None,
    timeFrom: Union[datetime.time, None] = None,
    timeUntil: Union[datetime.time, None] = None,
) -> AggregateDetails:
    """Retrieves aggregate delay statistics for a streetcar line, for incidents that occur between
    the specified stop and the next one.
    """
    filtered_df = _filter_delay_data(
        line=line,
        stop_before=closestStopBefore,
        date_from=dateFrom,
        date_until=dateUntil,
        time_from=timeFrom,
        time_until=timeUntil,
    )

    top_incidents = filtered_df["Incident"].value_counts()[:3]

    return AggregateDetails(
        closestStopBefore=closestStopBefore,
        topIncidentTypes=[f"{incident} ({count})" for incident, count in top_incidents.items()],
    )


@app.get("/maps", response_class=Response)
async def svg_map(line: str):
    """Retrieves a svg map of the stops of the specfied streetcar line."""
    if line not in STREETCAR_STOPS:
        raise HTTPException(400, detail=f"Streetcar line {line} not found")

    generator = SVGGenerator(STREETCAR_STOPS[line])
    return Response(content=bytes(str(generator.make_svg()), "utf-8"), media_type="image/svg+xml")


@app.get("/help")
async def help() -> str:
    """Returns a help text about the application in Markdown format."""
    with open(config.HELPFILE) as help_file:
        return help_file.read()
