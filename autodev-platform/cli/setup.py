from setuptools import setup, find_packages

setup(
    name="autodev-cli",
    version="1.0.0",
    description="AutoDev Platform CLI - Autonomous Development System",
    author="Capital Tech Alliance",
    author_email="andrew.m@capitaltechalliance.com",
    packages=find_packages(),
    install_requires=[
        "click>=8.1.7",
        "requests>=2.31.0",
        "rich>=13.7.0",
        "pydantic>=2.5.3",
        "httpx>=0.26.0",
        "python-dotenv>=1.0.0",
    ],
    entry_points={
        "console_scripts": [
            "autodev=autodev.cli:cli",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.11",
)
