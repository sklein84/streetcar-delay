# Dashboard information

## General
This dashboard allows to exploration of TTC streetcar delay data. The delay data has been collected from the city's [open data portal](https://open.toronto.ca/dataset/ttc-streetcar-delay-data/) and enriched with Google's [geocoding API](https://developers.google.com/maps/documentation/geocoding/overview) so that location descriptions could be mapped to lattitude-longitude coordinates.

## Using the dashboard
Select a streetcar line and a statistic from the dropdown menus on the upper left. The view below will update to show a schematic list of the streetcar stops of the selected line, along with a bar indicating the magnitude of the chosen statistic, reflecting the delay events that occured between the two stops.

On the upper right you have the options to filter the delay events on a date range, as well as on a time range. For example, selecting the date range 01 / 01 / 2020 - 31 / 12 / 2020 and a time range 10:00 - 15:00 will select only delay events that were recorded in 2020 between 10 a.m. and 3 p.m. When the "Apply Filter" button is pressed, the view will update to include only the selected delay events.

Click on a bar between two stops to open a window with more information about the delay incident types for the selected slice of data.

## Technical
The dashboard is built using Angular 16, it is served by a backend built with FastAPI.