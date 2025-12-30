from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    user_id: int
    role: str


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: int
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class FarmCreate(BaseModel):
    name: str
    location: Optional[str] = None


class FarmRead(BaseModel):
    id: int
    name: str
    location: Optional[str] = None

    class Config:
        from_attributes = True


class ZoneRead(BaseModel):
    id: int
    farm_id: int
    name: str

    class Config:
        from_attributes = True


class ZoneCreate(BaseModel):
    farm_id: int
    name: str = "main"


class DeviceCreate(BaseModel):
    farm_id: int
    zone_id: int
    type: str
    name: str


class DeviceRead(BaseModel):
    id: int
    farm_id: int
    zone_id: int
    type: str
    name: str
    device_token: str

    class Config:
        from_attributes = True


class CameraCreate(BaseModel):
    farm_id: int
    zone_id: int
    type: str
    name: str
    stream_url: str


class CameraRead(CameraCreate):
    id: int

    class Config:
        from_attributes = True


class SensorIngest(BaseModel):
    farm_id: int
    zone_id: int
    temperatureC: float
    turbidityNTU: float
    dissolvedOxygenMgL: float
    ph: Optional[float] = None


class SensorPoint(BaseModel):
    t: str
    temperatureC: float
    turbidityNTU: float
    dissolvedOxygenMgL: float
    ph: Optional[float] = None
    doSaturationPercent: Optional[float] = None


class Snapshot(BaseModel):
    temperatureC: float
    turbidityNTU: float
    dissolvedOxygenMgL: float
    ph: Optional[float] = None
    doSaturationPercent: Optional[float] = None
    updatedAt: datetime


class EventIngest(BaseModel):
    farm_id: int
    zone_id: int
    type: str
    confidence: float
    message: str
    snapshot_url: Optional[str] = None
    camera_id: Optional[int] = None
    device_id: Optional[int] = None


class EventRead(EventIngest):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class HeartbeatIngest(BaseModel):
    farm_id: int
    zone_id: int
