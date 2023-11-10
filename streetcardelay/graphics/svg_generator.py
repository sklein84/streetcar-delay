from typing import Any, Dict, List, Tuple

import svg
from pydantic import BaseModel

from streetcardelay.processing.spatial import mercator_project


class SVGStyle(BaseModel):
    """Model for styling the svg map of a streetcar line"""

    canvas_width: float = 1200
    line_width: Any = svg.Length(0.4, "%")
    line_color: str = "red"
    stop_radius: Any = svg.Length(0.5, "%")
    stop_color: str = "#263238"
    padding: int = 12
    id: str = "lineMap"


class SVGGenerator:
    """Generates SVG representation of streetcar lines

    Attributes:
        line_info: dictionary with streetcar line information about for which the SVG map should be
                   generated
        style: SVGStyle object that determines the styling of the generated map
    """

    _transformed_coordinates: List[Tuple[float, float]]
    _line_info: Dict[str, Any]

    def __init__(self, line_info, style: SVGStyle = SVGStyle()):
        self.style = style
        self._line_info = line_info

        # project, shift and pad stop coordinates
        self._transformed_coordinates = self._pad_upper_left(
            self._scale(
                self._shift_mirror_y(
                    [mercator_project(*coord) for coord in line_info["coordinates"]]
                )
            )
        )

    def _scale(self, coordinates: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
        """Scale stop coordinates to canvas width, preserving aspect ratio"""
        x_range = (
            max(coordinates, key=lambda coord: coord[0])[0]
            - min(coordinates, key=lambda coord: coord[0])[0]
        )

        scale_factor = self.style.canvas_width / x_range

        return [
            (
                coord[0] * scale_factor,
                coord[1] * scale_factor,
            )
            for coord in coordinates
        ]

    def _pad_upper_left(self, coordinates: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
        """Pad stop coordinates on the upper left, so that stop circles are fully visible on the
        map
        """
        return [
            (coord[0] + self.style.padding, coord[1] + self.style.padding) for coord in coordinates
        ]

    @staticmethod
    def _shift_mirror_y(coordinates: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
        """Shift and mirror y coordinates, so that positive positive y coordinates are on the lower
        half of the grid
        """
        min_x = min(coordinates, key=lambda coord: coord[0])[0]
        min_y = min(coordinates, key=lambda coord: coord[1])[1]
        max_y = max(coordinates, key=lambda coord: coord[1])[1]

        shifted = ((coord[0] - min_x, coord[1] - min_y) for coord in coordinates)
        mirrored_shifted = [(coord[0], max_y - min_y - coord[1]) for coord in shifted]

        return mirrored_shifted

    def make_svg(self, draw_stop_names: bool = False) -> svg.SVG:
        """Produce SVG map; if draw_stop_names is True, draw the stop names on the map as part of
        the SVG
        """
        stops: List[svg.Element] = [
            svg.Circle(
                cx=coord[0],
                cy=coord[1],
                id=f"stop:{name}",
                r=self.style.stop_radius,
                fill=self.style.stop_color,
                stroke_width=0,
            )
            for coord, name in zip(self._transformed_coordinates, self._line_info["stops"])
        ]

        lines: List[svg.Element] = [
            svg.Line(
                x1=start[0],
                y1=start[1],
                x2=end[0],
                y2=end[1],
                id=f"line:{name_before}",
                stroke=self.style.line_color,
                stroke_width=self.style.line_width,
                stroke_linecap="round",
            )
            for start, end, name_before in zip(
                self._transformed_coordinates,
                self._transformed_coordinates[1:],
                self._line_info["stops"],
            )
        ]

        elements = lines + stops

        if draw_stop_names:
            stop_texts: List[svg.Element] = [
                svg.Text(
                    x=coord[0] + self.style.stop_radius + 2,
                    y=coord[1] + self.style.stop_radius + 2,
                    text=txt,
                )
                for coord, txt in zip(self._transformed_coordinates, self._line_info["stops"])
            ]
            elements += stop_texts

        width = max(coord[0] for coord in self._transformed_coordinates) + self.style.padding
        height = max(coord[1] for coord in self._transformed_coordinates) + self.style.padding

        return svg.SVG(
            id=self.style.id,
            viewBox=svg.ViewBoxSpec(0, 0, width, height),
            elements=elements,
        )
