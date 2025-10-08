from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy.orm import Session
from . import models, database


def get_cycle_dates(frequency: models.Frequency, reference_date: datetime = None):
    if reference_date is None:
        reference_date = datetime.utcnow()

    if frequency == models.Frequency.monthly:
        start_date = reference_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = (start_date + relativedelta(months=1)) - timedelta(seconds=1)

    elif frequency == models.Frequency.quarterly:
        quarter = (reference_date.month - 1) // 3 + 1
        start_month = 3 * (quarter - 1) + 1
        start_date = reference_date.replace(month=start_month, day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = (start_date + relativedelta(months=3)) - timedelta(seconds=1)

    elif frequency == models.Frequency.yearly:
        start_date = reference_date.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = reference_date.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)

    else:
        raise ValueError(f"Unsupported frequency: {frequency}")

    return start_date, end_date


def create_cycle_for_company(db: Session, company: models.Company, frequency: models.Frequency, reference_date: datetime = None):
    start_date, end_date = get_cycle_dates(frequency, reference_date)

    existing = (
        db.query(models.MaintenanceCycle)
        .filter(
            models.MaintenanceCycle.company_id == company.id,
            models.MaintenanceCycle.start_date == start_date,
            models.MaintenanceCycle.end_date == end_date,
            models.MaintenanceCycle.frequency == frequency,
        )
        .first()
    )
    if existing:
        return existing

    # Create new cycle
    new_cycle = models.MaintenanceCycle(
        company_id=company.id,
        start_date=start_date,
        end_date=end_date,
        frequency=frequency,
    )
    db.add(new_cycle)
    db.commit()
    db.refresh(new_cycle)

    # Create TaskInstances
    for assignment in company.assignments:
        instance = models.TaskInstance(
            assignment_id=assignment.id,
            cycle_id=new_cycle.id,
            status="pending",
        )
        db.add(instance)

    db.commit()
    return new_cycle


def run_scheduler(db: Session, reference_date: datetime = None):
    if reference_date is None:
        reference_date = datetime.utcnow()

    companies = db.query(models.Company).all()
    for company in companies:
        # right now default to monthly – you can later store per-company frequency
        frequency = models.Frequency.monthly
        create_cycle_for_company(db, company, frequency, reference_date)


def start_scheduler():
    """Called on FastAPI startup"""
    db = database.SessionLocal()
    try:
        run_scheduler(db)
    finally:
        db.close()
