import datetime
from typing import Union

from pydantic import BaseModel, ConfigDict, Field


class StreetCarDelay(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    date: datetime.date = Field(alias="Date")
    time: datetime.time = Field(alias="Time")
    line: str = Field(alias="Line")
    locationDescription: Union[str, None] = Field(alias="Location")
    delayMinutes: Union[float, None] = Field(alias="Min Delay")
    closestStopBefore: Union[str, None] = Field(alias="closest_stop_before")
    closestStopAfter: Union[str, None] = Field(alias="closest_stop_after")


class StreetCarDelayAggregate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    closestStopBefore: Union[str, None] = Field(alias="closest_stop_before")
    closestStopAfter: Union[str, None] = Field(alias="closest_stop_after")
    totalCount: int = Field(alias="Min Delay_count")
    totalDelay: float = Field(alias="Min Delay_sum")
