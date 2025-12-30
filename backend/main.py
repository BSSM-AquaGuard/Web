from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select
from .config import settings
from .database import init_db, engine
from .models import User, Farm, Zone
from .auth import get_password_hash
from .routers_auth import router as auth_router
from .routers_farms import router as farms_router
from .routers_admin import router as admin_router
from .routers_ingest import router as ingest_router

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    init_db()
    with Session(engine) as session:
        # seed admin
        admin = session.exec(select(User).where(User.email == settings.admin_email)).first()
        if not admin:
            admin = User(email=settings.admin_email, password_hash=get_password_hash(settings.admin_password), role="admin")
            session.add(admin)
            session.commit()
        # seed default farm/zone if empty
        has_farm = session.exec(select(Farm)).first()
        if not has_farm:
            farm = Farm(name="기본 양식장", location="local", owner_id=None)
            session.add(farm)
            session.commit()
            session.refresh(farm)
            zone = Zone(farm_id=farm.id, name="main")
            session.add(zone)
            session.commit()
        else:
            farm = has_farm
            # 기존 기본 양식장이 admin 소유로 박혀 있다면 소유자 해제해서 첫 사용자에게 양도 가능하게 함
            if farm.name == "기본 양식장" and admin and farm.owner_id == admin.id:
                farm.owner_id = None
                session.add(farm)
                session.commit()


# Routers
app.include_router(auth_router)
app.include_router(farms_router)
app.include_router(admin_router)
app.include_router(ingest_router)


# Static serving for built frontend (optional)
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")


@app.get("/health")
def health():
    return {"status": "ok"}
