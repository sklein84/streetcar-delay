from setuptools import find_packages, setup
from .streetcardelay.api import __version__ as version

setup(
    name="streetcardelay",
    version=version,
    packages=find_packages(include=["streetcardelay", "streetcardelay.*"]),
    install_requires=["fastapi", "pandas", "requests", "uvicorn"],
    tests_require=["pytest"],
)
