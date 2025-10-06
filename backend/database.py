# app/database.py
import os
import time
import pymysql
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")

# Globals to be set by init_db()
engine = None
SessionLocal = None

def get_engine_with_retry(max_retries: int = 30, delay: int = 2):
    """
    Try to create an engine and connect to DB. Retry until success or raise.
    """
    last_exc = None
    for attempt in range(1, max_retries + 1):
        try:
            eng = create_engine(DATABASE_URL, pool_pre_ping=True)
            # test connection
            with eng.connect() as conn:
                pass
            return eng
        except Exception as e:
            last_exc = e
            print(f"[database] DB not ready (attempt {attempt}/{max_retries}): {e}")
            time.sleep(delay)

    raise RuntimeError(f"Could not connect to DB after {max_retries} attempts, last error: {last_exc}")

def init_db(max_retries: int = 30, delay: int = 2):
    """
    Initialize global engine and SessionLocal. Call this at application startup,
    AFTER Docker/MySQL has started (we will call it on FastAPI startup_event).
    """
    global engine, SessionLocal
    if engine is not None and SessionLocal is not None:
        return

    if DATABASE_URL is None:
        raise RuntimeError("DATABASE_URL is not set in the environment")

    engine = get_engine_with_retry(max_retries=max_retries, delay=delay)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
