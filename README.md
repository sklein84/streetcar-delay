# TTC streetcar delay dashboard

## About
A dashboard to explore historical TTC streetcar delay data. The project consists of a Python backend using [FastAPI](https://fastapi.tiangolo.com) and a frontend component written in [Angular](https://angular.io). The Python project includes some tools to obtain the delay incident data from from the city's [open data portal](https://open.toronto.ca/dataset/ttc-streetcar-delay-data/) as well as to enrich it with the [Google Maps Geocoding API](https://developers.google.com/maps/documentation/geocoding/overview).

[Live demo](https://sklein.me/delayDashboard/)

## Running the dashboard locally

As a first step, clone the repository.

### Backend

In order to run the backend, create a virtual environment and install the package from the repository root with
```shell
pip install .
```
Run it by executing
```shell
uvicorn streetcardelay.api:app
```

### Dashboard
Make sure you have the Angular 16 CLI installed. From the `delayDashboard` subdirectory, run
```shell
ng serve
```
