import pytest
from fastapi.testclient import TestClient

from streetcardelay.api import app


@pytest.fixture(scope="module")
def test_client():
    with TestClient(app) as client:
        yield client


def test_metadata(test_client: TestClient):
    metadata = test_client.get("/metadata")
    metadata.raise_for_status()
    assert metadata.text, "Help text is empty"


def test_streetcarLines(test_client: TestClient):
    lines = test_client.get("/streetcarLines")
    lines.raise_for_status()
    assert set(lines.json()) == {
        "301",
        "304",
        "306",
        "310",
        "501",
        "503",
        "504",
        "506",
        "508",
        "509",
        "510",
        "511",
        "512",
    }


def test_streetcarDelays(test_client: TestClient):
    lines = ["501", "502", "503", "504", "505", "506", "508", "511", "512"]
    for line in lines:
        delay_data = test_client.get(f"/streetcarDelays/{line}")
        delay_data.raise_for_status()
        assert delay_data.json(), f"No data delay data for line {line}"


def test_streetcarDelays_aggregate(test_client: TestClient):
    aggregate_data_504 = test_client.get(
        "/streetcarDelays/504/aggregate",
        params={
            "dateFrom": "2014-01-02",
            "dateUntil": "2014-01-07",
            "timeFrom": "06:00",
            "timeUntil": "23:00",
        },
    )

    aggregate_data_504.raise_for_status()
    assert aggregate_data_504.json(), "No aggregate delay data for line 504"


def test_streetcarDelays_aggregate_details(test_client: TestClient):
    details = test_client.get(
        "/streetcarDelays/504/aggregate/King St West / Sudbury St",
        params={
            "dateFrom": "2014-01-02",
            "dateUntil": "2014-01-07",
            "timeFrom": "06:00",
            "timeUntil": "23:00",
        },
    )

    details.raise_for_status()
    assert details.json(), "No aggregate details for line 504 at King St West / Sudbury St"


def test_help(test_client: TestClient):
    help_text = test_client.get("/help")

    help_text.raise_for_status()
    assert help_text.text
