from streetcardelay.spatial import find_closest_stop_pair


def test_find_closest_stop_pair():
    stops = [
        (43.6509771, -79.440017),
        (43.652555, -79.4325456),
        (43.6536125, -79.4263938),
    ]

    assert find_closest_stop_pair(stops, (43.6517999, -79.4363448)) == 0
    assert find_closest_stop_pair(stops, (43.6529203, -79.4296335)) == 1
