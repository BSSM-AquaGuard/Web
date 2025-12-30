from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlmodel import Session, select
from .database import get_session
from .models import Farm, Zone, SensorData, AIEvent, Camera
from . import schemas

router = APIRouter(prefix="/api", tags=["farms"])


def calc_do_saturation_percent(temp_c: float | None, do_mgl: float | None) -> float | None:
    """
    근사식(담수, 1기압)을 사용해 DO 포화도(%)를 계산합니다.
    """
    if temp_c is None or do_mgl is None:
        return None
    # Weiss 식 단순 근사 (0~30°C 영역): mg/L
    do_sat = 14.652 - 0.41022 * temp_c + 0.0079910 * temp_c * temp_c - 0.000077774 * temp_c * temp_c * temp_c
    if do_sat <= 0:
        return None
    return round((do_mgl / do_sat) * 100, 2)


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
    do_percent = calc_do_saturation_percent(row.temperatureC, row.dissolvedOxygenMgL)
    return schemas.Snapshot(
        temperatureC=row.temperatureC,
        turbidityNTU=row.turbidityNTU,
        dissolvedOxygenMgL=row.dissolvedOxygenMgL,
        ph=row.ph,
        doSaturationPercent=do_percent,
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
        do_percent = calc_do_saturation_percent(row.temperatureC, row.dissolvedOxygenMgL)
        points.append(
            schemas.SensorPoint(
                t=t,
                temperatureC=row.temperatureC,
                turbidityNTU=row.turbidityNTU,
                dissolvedOxygenMgL=row.dissolvedOxygenMgL,
                doSaturationPercent=do_percent,
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
