from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlmodel import Session, select
from .database import get_session
from .models import Farm, Zone, SensorData, AIEvent, Camera
from . import schemas

router = APIRouter(prefix="/api", tags=["farms"])


@router.get("/farms", response_model=List[schemas.FarmRead])
def list_farms(session: Session = Depends(get_session)):
    return session.exec(select(Farm)).all()


@router.get("/farms/{farm_id}/zones", response_model=List[schemas.ZoneRead])
def list_zones(farm_id: int, session: Session = Depends(get_session)):
    farm = session.get(Farm, farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return session.exec(select(Zone).where(Zone.farm_id == farm_id)).all()


@router.get("/farms/{farm_id}/zones/{zone_id}/snapshot", response_model=schemas.Snapshot)
def get_snapshot(farm_id: int, zone_id: int, session: Session = Depends(get_session)):
    stmt = (
        select(SensorData)
        .where(SensorData.farm_id == farm_id, SensorData.zone_id == zone_id)
        .order_by(SensorData.created_at.desc())
        .limit(1)
    )
    row = session.exec(stmt).first()
    if not row:
        raise HTTPException(status_code=404, detail="No sensor data")
    return schemas.Snapshot(
        temperatureC=row.temperatureC,
        turbidityNTU=row.turbidityNTU,
        dissolvedOxygenMgL=row.dissolvedOxygenMgL,
        ph=row.ph,
        updatedAt=row.created_at,
    )


@router.get("/farms/{farm_id}/zones/{zone_id}/series", response_model=List[schemas.SensorPoint])
def get_series(farm_id: int, zone_id: int, range: str = "1h", session: Session = Depends(get_session)):
    delta = timedelta(hours=1 if range == "1h" else 24)
    since = datetime.utcnow() - delta
    stmt = (
        select(SensorData)
        .where(SensorData.farm_id == farm_id, SensorData.zone_id == zone_id, SensorData.created_at >= since)
        .order_by(SensorData.created_at)
    )
    data = session.exec(stmt).all()
    points: list[schemas.SensorPoint] = []
    for row in data:
        t = row.created_at.strftime("%H:%M")
        points.append(
            schemas.SensorPoint(
                t=t,
                temperatureC=row.temperatureC,
                turbidityNTU=row.turbidityNTU,
                dissolvedOxygenMgL=row.dissolvedOxygenMgL,
                ph=row.ph,
            )
        )
    return points


@router.get("/farms/{farm_id}/events", response_model=List[schemas.EventRead])
def list_events(farm_id: int, range: str = "24h", session: Session = Depends(get_session)):
    delta = timedelta(hours=24 if range == "24h" else 1)
    since = datetime.utcnow() - delta
    stmt = (
        select(AIEvent)
        .where(AIEvent.farm_id == farm_id, AIEvent.created_at >= since)
        .order_by(AIEvent.created_at.desc())
    )
    return session.exec(stmt).all()


@router.get("/farms/{farm_id}/cameras", response_model=List[schemas.CameraRead])
def list_cameras(farm_id: int, session: Session = Depends(get_session)):
    return session.exec(select(Camera).where(Camera.farm_id == farm_id)).all()
