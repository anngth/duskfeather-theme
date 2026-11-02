"""Fetch the current temperature for a list of cities."""
from __future__ import annotations

import json
from dataclasses import dataclass
from urllib.request import urlopen

API = "https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m"


@dataclass(frozen=True)
class City:
    name: str
    lat: float
    lon: float


CITIES = [City("Hanoi", 21.03, 105.85), City("Singapore", 1.35, 103.82)]


def temperature(city: City, timeout: float = 5.0) -> float | None:
    try:
        with urlopen(API.format(lat=city.lat, lon=city.lon), timeout=timeout) as resp:
            return json.load(resp)["current"]["temperature_2m"]
    except (OSError, KeyError) as err:
        print(f"skipping {city.name}: {err}")
        return None


if __name__ == "__main__":
    for city in CITIES:
        if (t := temperature(city)) is not None:
            print(f"{city.name:<10} {t:>5.1f} °C")
