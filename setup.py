from setuptools import setup, find_packages

setup(
    name="streetcardelay",
    version="0.1.0",
    packages=find_packages(include=["streetcardelay", "streetcardelay.*"]),
    install_requires=["requests"],
    tests_require=["pytest"],
)
