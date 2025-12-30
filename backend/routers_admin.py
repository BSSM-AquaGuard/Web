from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, delete
from .deps import get_current_user
from .database import get_session
from . import schemas
from .models import Farm, Zone, Device, Camera, User, SensorData, AIEvent

router = APIRouter(prefix="/api/admin", tags=["admin"])


def ensure_farm_owner_or_admin(farm: Farm, user: User, session: Session):
    if user.role == "admin":
        return
    if farm.owner_id is None:
        # unclaimed farm can be claimed by first modifier
        farm.owner_id = user.id
        session.add(farm)
        session.commit()
        session.refresh(farm)
        return
    if farm.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not your farm")


@router.post("/farms", response_model=schemas.FarmRead)
def create_farm(payload: schemas.FarmCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    farm = Farm(name=payload.name, location=payload.location, owner_id=current_user.id)
    session.add(farm)
    session.commit()
    session.refresh(farm)
    # 기본 zone 생성
    zone = Zone(farm_id=farm.id, name="main")
    session.add(zone)
    session.commit()
    return farm


@router.post("/zones", response_model=schemas.ZoneRead)
def create_zone(payload: schemas.ZoneCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    farm = session.get(Farm, payload.farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    ensure_farm_owner_or_admin(farm, current_user, session)
    zone = Zone(farm_id=payload.farm_id, name=payload.name)
    session.add(zone)
    session.commit()
    session.refresh(zone)
    return zone


@router.post("/devices", response_model=schemas.DeviceRead)
def create_device(payload: schemas.DeviceCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    farm = session.get(Farm, payload.farm_id)
    zone = session.get(Zone, payload.zone_id)
    if not farm or not zone:
        raise HTTPException(status_code=404, detail="Farm or Zone not found")
    ensure_farm_owner_or_admin(farm, current_user, session)
    device = Device(farm_id=payload.farm_id, zone_id=payload.zone_id, type=payload.type, name=payload.name)
    session.add(device)
    session.commit()
    session.refresh(device)
    return device


@router.post("/cameras", response_model=schemas.CameraRead)
def create_camera(payload: schemas.CameraCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    farm = session.get(Farm, payload.farm_id)
    zone = session.get(Zone, payload.zone_id)
    if not farm or not zone:
        raise HTTPException(status_code=404, detail="Farm or Zone not found")
    ensure_farm_owner_or_admin(farm, current_user, session)
    cam = Camera(**payload.dict())
    session.add(cam)
    session.commit()
    session.refresh(cam)
    return cam


@router.delete("/cameras/{camera_id}", status_code=204)
def delete_camera(camera_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    cam = session.get(Camera, camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    farm = session.get(Farm, cam.farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    ensure_farm_owner_or_admin(farm, current_user, session)
    session.delete(cam)
    session.commit()


@router.delete("/farms/{farm_id}", status_code=204)
def delete_farm(farm_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    farm = session.get(Farm, farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    ensure_farm_owner_or_admin(farm, current_user, session)

    # delete dependent resources
    session.exec(delete(SensorData).where(SensorData.farm_id == farm_id))
    session.exec(delete(AIEvent).where(AIEvent.farm_id == farm_id))
    session.exec(delete(Camera).where(Camera.farm_id == farm_id))
    session.exec(delete(Device).where(Device.farm_id == farm_id))
    session.exec(delete(Zone).where(Zone.farm_id == farm_id))
    session.delete(farm)
    session.commit()
