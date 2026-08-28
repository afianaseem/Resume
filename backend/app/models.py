import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Integer, nullable=False, default=0, server_default="0")
    is_active = Column(Integer, nullable=False, default=1, server_default="1")
    profile_image = Column(String, nullable=True)  # store a URL or base64 string
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    resumes = relationship("Resume", back_populates="owner", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # resume/template name chosen by the user
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Selected accent color for the template.
    color = Column(String, nullable=False, default="violet", server_default="violet")

    # Which visual layout to render the resume with, e.g. "classic",
    # "modern", "minimal", "bold". Purely a presentation setting — the
    # underlying resume data below is identical for every template.
    template = Column(String, nullable=False, default="classic", server_default="classic")

    # Structured resume data, stored as JSON so the form schema can evolve
    # without needing a migration for every new field.
    personal_info = Column(JSON, default=dict)   # {full_name, email, phone, address, summary, links: []}
    education = Column(JSON, default=list)        # [{school, degree, field, start_date, end_date, grade}]
    experience = Column(JSON, default=list)        # [{company, role, start_date, end_date, description}]
    skills = Column(JSON, default=list)             # ["Python", "React", ...]
    projects = Column(JSON, default=list)           # [{title, description, link, tech_stack}]
    section_order = Column(JSON, default=lambda: ["summary", "experience", "education", "skills", "projects"])

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="resumes")


class ResumeVersion(Base):
    __tablename__ = "resume_versions"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    label = Column(String, nullable=False)
    template = Column(String, nullable=False, default="classic")
    color = Column(String, nullable=False, default="violet")
    personal_info = Column(JSON, default=dict)
    education = Column(JSON, default=list)
    experience = Column(JSON, default=list)
    skills = Column(JSON, default=list)
    projects = Column(JSON, default=list)
    section_order = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    resume = relationship("Resume", back_populates="versions")

Resume.versions = relationship("ResumeVersion", back_populates="resume", cascade="all, delete-orphan")
