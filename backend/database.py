from pathlib import Path
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import text
from .config import settings

DB_PATH = Path(settings.sqlite_path)
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
engine = create_engine(f"sqlite:///{DB_PATH}", echo=False, connect_args={"check_same_thread": False})


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    # lightweight migration: add owner_id to farm if missing
    with engine.begin() as conn:
        cols = [row[1] for row in conn.execute(text("PRAGMA table_info('farm')"))]
        if "owner_id" not in cols:
            conn.execute(text("ALTER TABLE farm ADD COLUMN owner_id INTEGER"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_farm_owner_id ON farm(owner_id)"))


def get_session() -> Session:
    with Session(engine) as session:
        yield session
