from datetime import datetime
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlmodel import Session, select
from .database import get_session
from .models import Device, SensorData, AIEvent, Farm, Zone
from . import schemas

router = APIRouter(prefix="/api/ingest", tags=["ingest"])


def validate_device(token: str | None, session: Session) -> Device:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Device token required")
    device = session.exec(select(Device).where(Device.device_token == token)).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid device token")
    return device


@router.post("/sensor")
def ingest_sensor(payload: schemas.SensorIngest, session: Session = Depends(get_session), x_device_token: str | None = Header(default=None, convert_underscores=True)):
    device = validate_device(x_device_token, session)
    if device.farm_id != payload.farm_id or device.zone_id != payload.zone_id:
        raise HTTPException(status_code=400, detail="Device farm/zone mismatch")
    row = SensorData(
        farm_id=payload.farm_id,
        zone_id=payload.zone_id,
        device_id=device.id,
        temperatureC=payload.temperatureC,
        turbidityNTU=payload.turbidityNTU,
        dissolvedOxygenMgL=payload.dissolvedOxygenMgL,
        ph=payload.ph,
    )
    session.add(row)
    device.last_seen = datetime.utcnow()
    session.add(device)
    session.commit()
    return {"ok": True}


@router.post("/event")
def ingest_event(payload: schemas.EventIngest, session: Session = Depends(get_session), x_device_token: str | None = Header(default=None, convert_underscores=True)):
    device = validate_device(x_device_token, session)
    if device.farm_id != payload.farm_id or device.zone_id != payload.zone_id:
        raise HTTPException(status_code=400, detail="Device farm/zone mismatch")
    row = AIEvent(
        farm_id=payload.farm_id,
        zone_id=payload.zone_id,
        camera_id=payload.camera_id,
        device_id=device.id,
        type=payload.type,
        confidence=payload.confidence,
        message=payload.message,
        snapshot_url=payload.snapshot_url,
    )
    session.add(row)
    device.last_seen = datetime.utcnow()
    session.add(device)
    session.commit()
    return {"ok": True}


@router.post("/heartbeat")
def ingest_heartbeat(payload: schemas.HeartbeatIngest, session: Session = Depends(get_session), x_device_token: str | None = Header(default=None, convert_underscores=True)):
    device = validate_device(x_device_token, session)
    if device.farm_id != payload.farm_id or device.zone_id != payload.zone_id:
        raise HTTPException(status_code=400, detail="Device farm/zone mismatch")
    device.last_seen = datetime.utcnow()
    session.add(device)
    session.commit()
    return {"ok": True, "last_seen": device.last_seen}
