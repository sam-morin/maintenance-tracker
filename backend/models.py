import uuid
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship, declarative_base
import enum
from datetime import datetime

Base = declarative_base()

# -----------------------
# Enums
# -----------------------

class Frequency(enum.Enum):
    monthly = "monthly"
    quarterly = "quarterly"
    yearly = "yearly"

# -----------------------
# Core Tables
# -----------------------

class Company(Base):
    __tablename__ = "companies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(255), unique=True, nullable=False)
    address = Column(String(255))
    point_of_contact = Column(String(255))
    last_updated = Column(DateTime, default=datetime.utcnow)
    last_updated_by = Column(String(255))

    # Relationships
    assignments = relationship("CompanyTaskAssignment", back_populates="company")
    cycles = relationship(
        "MaintenanceCycle",
        back_populates="company",
        cascade="all, delete-orphan"
    )


class Task(Base):
    """
    A general definition of a maintenance task (e.g., 'Check backup logs').
    """
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text)
    documentation_link = Column(String(255))
    last_updated = Column(DateTime, default=datetime.utcnow)
    last_updated_by = Column(String(255))

    # Relationships
    assignments = relationship("CompanyTaskAssignment", back_populates="task")
    instances = relationship("TaskInstance", back_populates="task")

# -----------------------
# Linking Tables
# -----------------------

class CompanyTaskAssignment(Base):
    """
    Links a task definition to a company.
    Example: Acme Corp is assigned 'Check backup logs'.
    """
    __tablename__ = "company_task_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    task_id = Column(String(36), ForeignKey("tasks.id"), nullable=False)

    company = relationship("Company", back_populates="assignments")
    task = relationship("Task", back_populates="assignments")

    # This assignment generates task instances in each maintenance cycle
    instances = relationship("TaskInstance", back_populates="assignment")

# -----------------------
# Maintenance Cycles
# -----------------------

class MaintenanceCycle(Base):
    """
    A maintenance cycle is a time-bound period where all assigned tasks
    for a company must be completed.
    Example: Acme Corp, October 2025, frequency=monthly.
    """
    __tablename__ = "maintenance_cycles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    frequency = Column(Enum(Frequency), nullable=False)

    company = relationship("Company", back_populates="cycles")
    tasks = relationship("TaskInstance", back_populates="cycle")

# -----------------------
# Task Instances
# -----------------------

class TaskInstance(Base):
    """
    A specific occurrence of a task for a given maintenance cycle.
    Example: 'Check backup logs' for Acme Corp, October 2025.
    """
    __tablename__ = "task_instances"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    assignment_id = Column(String(36), ForeignKey("company_task_assignments.id"), nullable=False)
    cycle_id = Column(String(36), ForeignKey("maintenance_cycles.id"), nullable=False)
    task_id = Column(String(36), ForeignKey("tasks.id"), nullable=False)

    status = Column(String(20), default="pending")  # pending, completed, skipped
    notes = Column(Text)
    completed_at = Column(DateTime, nullable=True)
    skipped_at = Column(DateTime, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    last_updated_by = Column(String(255))
    notes = Column(Text)

    assignment = relationship("CompanyTaskAssignment", back_populates="instances")
    cycle = relationship("MaintenanceCycle", back_populates="tasks")
    task = relationship("Task", back_populates="instances")
