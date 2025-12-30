from datetime import datetime
from fastapi import APIRouter, Depends
from sqlmodel import Session
from .database import get_session
from .models import SensorData, AIEvent
from . import schemas

router = APIRouter(prefix="/api/ingest", tags=["ingest"])


@router.post("/sensor")
def ingest_sensor(payload: schemas.SensorIngest, session: Session = Depends(get_session)):
    row = SensorData(
        farm_id=payload.farm_id,
        zone_id=payload.zone_id,
        device_id=None,
        temperatureC=payload.temperatureC,
        turbidityNTU=payload.turbidityNTU,
        dissolvedOxygenMgL=payload.dissolvedOxygenMgL,
        ph=payload.ph,
    )
    session.add(row)
    session.commit()
    return {"ok": True}


@router.post("/event")
def ingest_event(payload: schemas.EventIngest, session: Session = Depends(get_session)):
    row = AIEvent(
        farm_id=payload.farm_id,
        zone_id=payload.zone_id,
        camera_id=payload.camera_id,
        device_id=None,
        type=payload.type,
        confidence=payload.confidence,
        message=payload.message,
        snapshot_url=payload.snapshot_url,
    )
    session.add(row)
    session.commit()
    return {"ok": True}


@router.post("/heartbeat")
def ingest_heartbeat(payload: schemas.HeartbeatIngest, session: Session = Depends(get_session)):
    # 토큰 없이 단순 헬스 체크 수신
    return {"ok": True, "received": datetime.utcnow().isoformat()}
