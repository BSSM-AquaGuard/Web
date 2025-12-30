from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from .deps import require_admin
from .database import get_session
from . import schemas
from .models import Farm, Zone, Device, Camera

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/farms", response_model=schemas.FarmRead)
def create_farm(payload: schemas.FarmCreate, session: Session = Depends(get_session), _: None = Depends(require_admin)):
    farm = Farm(name=payload.name, location=payload.location)
    session.add(farm)
    session.commit()
    session.refresh(farm)
    # 기본 zone 생성
    zone = Zone(farm_id=farm.id, name="main")
    session.add(zone)
    session.commit()
    return farm


@router.post("/zones", response_model=schemas.ZoneRead)
def create_zone(payload: schemas.ZoneCreate, session: Session = Depends(get_session), _: None = Depends(require_admin)):
    farm = session.get(Farm, payload.farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    zone = Zone(farm_id=payload.farm_id, name=payload.name)
    session.add(zone)
    session.commit()
    session.refresh(zone)
    return zone


@router.post("/devices", response_model=schemas.DeviceRead)
def create_device(payload: schemas.DeviceCreate, session: Session = Depends(get_session), _: None = Depends(require_admin)):
    farm = session.get(Farm, payload.farm_id)
    zone = session.get(Zone, payload.zone_id)
    if not farm or not zone:
        raise HTTPException(status_code=404, detail="Farm or Zone not found")
    device = Device(farm_id=payload.farm_id, zone_id=payload.zone_id, type=payload.type, name=payload.name)
    session.add(device)
    session.commit()
    session.refresh(device)
    return device


@router.post("/cameras", response_model=schemas.CameraRead)
def create_camera(payload: schemas.CameraCreate, session: Session = Depends(get_session), _: None = Depends(require_admin)):
    farm = session.get(Farm, payload.farm_id)
    zone = session.get(Zone, payload.zone_id)
    if not farm or not zone:
        raise HTTPException(status_code=404, detail="Farm or Zone not found")
    cam = Camera(**payload.dict())
    session.add(cam)
    session.commit()
    session.refresh(cam)
    return cam


@router.delete("/cameras/{camera_id}", status_code=204)
def delete_camera(camera_id: int, session: Session = Depends(get_session), _: None = Depends(require_admin)):
    cam = session.get(Camera, camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    session.delete(cam)
    session.commit()
