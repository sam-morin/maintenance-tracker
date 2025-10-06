from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, database
from .scheduler import start_scheduler

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # allow all origins
    allow_credentials=True,
    allow_methods=["*"],            # allow all methods (GET, POST, PUT, etc)
    allow_headers=["*"],            # allow all headers
)

@app.on_event("startup")
def startup_event():
    # 1) initialize DB (this will retry until DB is ready)
    database.init_db(max_retries=30, delay=2)

    # 2) create tables now that engine exists
    models.Base.metadata.create_all(bind=database.engine)

    # 3) start scheduler (it should use database.SessionLocal inside)
    start_scheduler()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---- TASKS ----
@app.post("/tasks/")
def create_task(task: dict, db: Session = Depends(get_db)):
    new_task = models.MaintenanceTasks(
        name=task["name"],
        description=task.get("description"),
        documentation_link=task.get("documentation_link")
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@app.get("/tasks/")
def list_tasks(db: Session = Depends(get_db)):
    return db.query(models.MaintenanceTasks).all()


# ---- COMPANIES ----
@app.post("/companies/")
def create_company(company: dict, db: Session = Depends(get_db)):
    new_company = models.Company(
        name=company["name"],
        point_of_contact=company.get("point_of_contact")
    )
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company

@app.get("/companies/")
def list_companies(db: Session = Depends(get_db)):
    return db.query(models.Company).all()