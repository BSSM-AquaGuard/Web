from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel
import uuid


def now_ts() -> datetime:
    return datetime.utcnow()


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str
    role: str = Field(default="operator")
    created_at: datetime = Field(default_factory=now_ts)


class Farm(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    location: Optional[str] = None


class Zone(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    farm_id: int = Field(foreign_key="farm.id")
    name: str = Field(default="main")


class Device(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    farm_id: int = Field(foreign_key="farm.id")
    zone_id: int = Field(foreign_key="zone.id")
    type: str
    name: str
    device_token: str = Field(default_factory=lambda: uuid.uuid4().hex, unique=True, index=True)
    last_seen: datetime = Field(default_factory=now_ts)


class SensorData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    farm_id: int = Field(foreign_key="farm.id")
    zone_id: int = Field(foreign_key="zone.id")
    device_id: int = Field(foreign_key="device.id")
    temperatureC: float
    turbidityNTU: float
    dissolvedOxygenMgL: float
    ph: Optional[float] = None
    created_at: datetime = Field(default_factory=now_ts, index=True)


class Camera(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    farm_id: int = Field(foreign_key="farm.id")
    zone_id: int = Field(foreign_key="zone.id")
    type: str
    name: str
    stream_url: str


class AIEvent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    farm_id: int = Field(foreign_key="farm.id")
    zone_id: int = Field(foreign_key="zone.id")
    camera_id: Optional[int] = Field(default=None, foreign_key="camera.id")
    device_id: Optional[int] = Field(default=None, foreign_key="device.id")
    type: str
    confidence: float
    message: str
    snapshot_url: Optional[str] = None
    created_at: datetime = Field(default_factory=now_ts, index=True)
