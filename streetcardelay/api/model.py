import datetime
from typing import List, Union

from pydantic import BaseModel, ConfigDict, Field


class StreetCarDelay(BaseModel):
    """Model for a single delay incident"""

    model_config = ConfigDict(populate_by_name=True)

    date: datetime.date = Field(alias="Date")
    time: datetime.time = Field(alias="Time")
    line: str = Field(alias="Line")
    locationDescription: Union[str, None] = Field(alias="Location")
    delayMinutes: Union[float, None] = Field(alias="Min Delay")
    closestStopBefore: Union[str, None] = Field(alias="closest_stop_before")
    closestStopAfter: Union[str, None] = Field(alias="closest_stop_after")


class StreetCarDelayAggregate(BaseModel):
    """Model for aggregated delay incident statistics between two stops"""

    model_config = ConfigDict(populate_by_name=True)

    closestStopBefore: Union[str, None] = Field(alias="closest_stop_before")
    closestStopAfter: Union[str, None] = Field(alias="closest_stop_after")
    totalCount: int = Field(alias="Min Delay_count")
    totalDelay: float = Field(alias="Min Delay_sum")


class AggregateDetails(BaseModel):
    """Model for more detailed aggregate information for delay incidents between two stops"""

    closestStopBefore: str
    topIncidentTypes: List[str]


class MetaData(BaseModel):
    """Model for delay metadata"""

    earliestDate: datetime.date
    latestDate: datetime.date
