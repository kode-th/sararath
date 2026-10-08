"""Test-wide fakes."""

import pytest

import sararath.collectors.http as http_module


class _AllowAllRobots:
    async def allows(self, client, url) -> bool:
        return True


@pytest.fixture(autouse=True)
def _allow_robots(monkeypatch):
    """Unit tests never fetch robots.txt; the robots cache has its own tests."""
    monkeypatch.setattr(http_module, "ROBOTS", _AllowAllRobots())
