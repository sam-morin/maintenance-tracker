import uuid
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, database
from .scheduler import start_scheduler
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]  # send to stdout
)

logger = logging.getLogger(__name__)

logger.info("Starting backend...")

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
        point_of_contact=company.get("point_of_contact"),
        address=company.get("address")
    )
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company

@app.put("/companies/{company_id}")
def update_company(company_id: str, company_data: dict, db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    for key, value in company_data.items():
        if hasattr(company, key):
            setattr(company, key, value)

    db.commit()
    db.refresh(company)
    return company


# @app.put("/companies/{company_id}")
# def update_company(company_id: uuid.UUID, company: dict, db: Session = Depends(get_db)):
#     logger.info(f"Update company {company_id}")
#     db_company = db.get(models.Company, company_id)
#     if db_company is None:
#         raise HTTPException(status_code=404, detail="Company not found")
#     db_company.name = company.get("name")
#     db_company.point_of_contact = company.get("point_of_contact")
#     db_company.address = company.get("address")
#     db.commit()
#     db.refresh(db_company)
#     return db_company

@app.get("/companies/")
def list_companies(db: Session = Depends(get_db)):
    return db.query(models.Company).all()

@app.get("/companies/{company_id}")
def get_company(company_id: uuid.UUID, db: Session = Depends(get_db)):
    logger.info(f"Get company {company_id}")
    company = db.get(models.Company, company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@app.delete("/companies/{company_id}")
def delete_company(company_id: uuid.UUID, db: Session = Depends(get_db)):
    logger.info(f"Delete company {company_id}")
    logger.debug(f"Querying company with id {company_id}")
    company = db.get(models.Company, company_id)
    if company is None:
        logger.warning(f"Company with id {company_id} not found")
        raise HTTPException(status_code=404, detail="Company not found")
    logger.info(f"Deleting company with id {company_id}")
    db.delete(company)
    db.commit()
    logger.info(f"Company with id {company_id} deleted")
    return
