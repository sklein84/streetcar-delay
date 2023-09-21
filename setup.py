from setuptools import find_packages, setup

setup(
    name="streetcardelay",
    version="0.1.0",
    packages=find_packages(include=["streetcardelay", "streetcardelay.*"]),
    install_requires=["fastapi", "pandas", "requests", "uvicorn"],
    tests_require=["pytest"],
)
