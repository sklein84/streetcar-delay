from multiprocessing import Pool
from typing import Dict, Tuple, Union

import pandas as pd
import requests

from streetcardelay.geocode import geocode_all_locations


class DelayDataDownloader:
    base_url = (
        "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show"
    )
    params = {"id": "ttc-streetcar-delay-data"}

    @classmethod
    def get_package(cls):
        return requests.get(cls.base_url, params=cls.params).json()

    @classmethod
    def get_latest_dataset(cls) -> pd.DataFrame:
        delay_datasets = cls.get_package()["result"]["resources"]
        latest_dataset = max(
            (dset for dset in delay_datasets if "readme" not in dset["name"]),
            key=lambda dset: pd.to_datetime(dset["created"]),
        )

        return pd.read_excel(latest_dataset["url"])

    @classmethod
    def get_all_data(cls) -> pd.DataFrame:
        delay_datasets = cls.get_package()["result"]["resources"]
        urls = [dset["url"] for dset in delay_datasets if "readme" not in dset["name"]]

        with Pool(5) as p:
            dfs = p.map(pd.read_excel, urls)

        for df in dfs:
            df.rename(
                {
                    "Report Date": "Date",
                    "Route": "Line",
                    "Delay": "Min Delay",
                    "Gap": "Min Gap",
                    "Direction": "Bound",
                },
                axis=1,
                inplace=True,
            )

        return pd.concat(dfs).reset_index(drop=True)

    @classmethod
    def geocode_locations(
        cls,
        delay_data: pd.DataFrame,
        geocoded_locations: Union[Dict[str, Tuple[float, float]], None] = None,
    ) -> pd.DataFrame:
        if geocoded_locations is None:
            geocoded_locations = geocode_all_locations(
                delay_data.Location.str.upper().unique()
            )

        coordinates = delay_data.Location.str.upper().apply(
            lambda location: geocoded_locations.get(location)
        )

        return delay_data.assign(location_coordinates=coordinates)
