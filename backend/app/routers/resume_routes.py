from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db
from ..email_utils import send_resume_email

router = APIRouter(prefix="/resumes", tags=["resumes"])


def _get_owned_resume(resume_id: int, current_user: models.User, db: Session) -> models.Resume:
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have access to this resume")
    return resume


@router.post("", response_model=schemas.ResumeOut, status_code=status.HTTP_201_CREATED)
def create_resume(
    payload: schemas.ResumeCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    resume = models.Resume(
        name=payload.name,
        owner_id=current_user.id,
        template=payload.template or "classic",
        color=payload.color or "violet",
        personal_info=payload.personal_info or {},
        education=payload.education or [],
        experience=payload.experience or [],
        skills=payload.skills or [],
        projects=payload.projects or [],
        section_order=payload.section_order or ["summary", "experience", "education", "skills", "projects"],
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.get("", response_model=List[schemas.ResumeListItem])
def list_resumes(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Resume)
        .filter(models.Resume.owner_id == current_user.id)
        .order_by(models.Resume.updated_at.desc())
        .all()
    )


@router.get("/{resume_id}", response_model=schemas.ResumeOut)
def get_resume(
    resume_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return _get_owned_resume(resume_id, current_user, db)


@router.put("/{resume_id}", response_model=schemas.ResumeOut)
def update_resume(
    resume_id: int,
    payload: schemas.ResumeUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    resume = _get_owned_resume(resume_id, current_user, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(resume, field, value)

    db.commit()
    db.refresh(resume)
    return resume



@router.get("/{resume_id}/versions", response_model=List[schemas.ResumeVersionOut])
def list_versions(
    resume_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    resume = _get_owned_resume(resume_id, current_user, db)
    return db.query(models.ResumeVersion).filter(
        models.ResumeVersion.resume_id == resume.id
    ).order_by(models.ResumeVersion.created_at.desc()).all()


@router.post("/{resume_id}/versions", response_model=schemas.ResumeVersionOut, status_code=status.HTTP_201_CREATED)
def create_version(
    resume_id: int,
    label: str = "Manual snapshot",
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    resume = _get_owned_resume(resume_id, current_user, db)
    version = models.ResumeVersion(
        resume_id=resume.id,
        label=(label or "Manual snapshot").strip()[:120],
        template=resume.template or "classic",
        color=resume.color or "violet",
        personal_info=resume.personal_info or {},
        education=resume.education or [],
        experience=resume.experience or [],
        skills=resume.skills or [],
        projects=resume.projects or [],
        section_order=resume.section_order or ["summary", "experience", "education", "skills", "projects"],
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


@router.post("/{resume_id}/duplicate", response_model=schemas.ResumeOut, status_code=status.HTTP_201_CREATED)
def duplicate_resume(
    resume_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    source = _get_owned_resume(resume_id, current_user, db)
    copy = models.Resume(
        name=f"{source.name} — Copy",
        owner_id=current_user.id,
        template=source.template or "classic",
        color=source.color or "violet",
        personal_info=source.personal_info or {},
        education=source.education or [],
        experience=source.experience or [],
        skills=source.skills or [],
        projects=source.projects or [],
        section_order=source.section_order or ["summary", "experience", "education", "skills", "projects"],
    )
    db.add(copy)
    db.commit()
    db.refresh(copy)
    return copy


@router.post("/{resume_id}/versions/{version_id}/restore", response_model=schemas.ResumeOut)
def restore_version(
    resume_id: int,
    version_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    resume = _get_owned_resume(resume_id, current_user, db)
    version = db.query(models.ResumeVersion).filter(
        models.ResumeVersion.id == version_id,
        models.ResumeVersion.resume_id == resume.id,
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    resume.template = version.template
    resume.color = version.color
    resume.personal_info = version.personal_info or {}
    resume.education = version.education or []
    resume.experience = version.experience or []
    resume.skills = version.skills or []
    resume.projects = version.projects or []
    resume.section_order = version.section_order or ["summary", "experience", "education", "skills", "projects"]
    db.commit()
    db.refresh(resume)
    return resume

@router.post("/{resume_id}/share")
def share_resume(
    resume_id: int,
    payload: schemas.ShareResumeRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    resume = _get_owned_resume(resume_id, current_user, db)

    resume_data = {
        "name": resume.name,
        "template": resume.template or "classic",
        "color": resume.color or "violet",
        "personal_info": resume.personal_info or {},
        "education": resume.education or [],
        "experience": resume.experience or [],
        "skills": resume.skills or [],
        "projects": resume.projects or [],
        "section_order": resume.section_order or [],
    }

    try:
        send_resume_email(
            to_email=payload.email,
            resume=resume_data,
            sender_name=current_user.name,
            note=payload.message or "",
            pdf_bytes=__import__("base64").b64decode(payload.pdf_base64.split(",", 1)[1] if payload.pdf_base64 and "," in payload.pdf_base64 else payload.pdf_base64) if payload.pdf_base64 else None,
        )
    except Exception as exc:
        print(f"[email-error] {exc}")
        raise HTTPException(
            status_code=502,
            detail=(
                "The email could not be sent. Check the SMTP settings in "
                "backend/.env and try again."
            ),
        )

    return {"message": f"Resume emailed to {payload.email}"}


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    resume = _get_owned_resume(resume_id, current_user, db)
    db.delete(resume)
    db.commit()
    return None
