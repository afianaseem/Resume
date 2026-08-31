from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from .. import models, auth
from ..database import get_db

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/data")
def admin_data(
    q: str = Query("", max_length=120),
    from_date: str = Query("", max_length=20),
    to_date: str = Query("", max_length=20),
    admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Single admin bootstrap request.

    The old frontend made 3 HTTP requests every time the admin dashboard
    opened: overview + users + resumes. Vercel serverless/database connection
    setup made that especially expensive. This endpoint returns all three
    datasets in one request.
    """
    now = datetime.utcnow()
    week_start = now - timedelta(days=7)

    users_count = db.query(func.count(models.User.id)).scalar() or 0
    resumes_count = db.query(func.count(models.Resume.id)).scalar() or 0
    recent_resumes = (
        db.query(func.count(models.Resume.id))
        .filter(models.Resume.created_at >= week_start)
        .scalar() or 0
    )
    active_users = (
        db.query(func.count(models.User.id))
        .filter(models.User.is_active == 1)
        .scalar() or 0
    )

    usage_rows = (
        db.query(models.Resume.template, func.count(models.Resume.id))
        .group_by(models.Resume.template)
        .all()
    )

    user_rows = (
        db.query(
            models.User.id,
            models.User.name,
            models.User.email,
            models.User.is_admin,
            models.User.created_at,
            models.User.is_active,
            func.count(models.Resume.id).label("resume_count"),
        )
        .outerjoin(models.Resume, models.Resume.owner_id == models.User.id)
        .group_by(
            models.User.id,
            models.User.name,
            models.User.email,
            models.User.is_admin,
            models.User.created_at,
            models.User.is_active,
        )
        .order_by(models.User.created_at.desc())
        .all()
    )

    resume_query = (
        db.query(
            models.Resume.id,
            models.Resume.name,
            models.Resume.template,
            models.Resume.color,
            models.Resume.owner_id,
            models.Resume.created_at,
            models.Resume.updated_at,
            models.User.name.label("owner_name"),
            models.User.email.label("owner_email"),
        )
        .join(models.User, models.User.id == models.Resume.owner_id)
    )

    term = q.strip()
    if term:
        like = f"%{term}%"
        resume_query = resume_query.filter(
            or_(
                models.Resume.name.ilike(like),
                models.User.name.ilike(like),
                models.User.email.ilike(like),
            )
        )

    if from_date:
        try:
            resume_query = resume_query.filter(
                models.Resume.created_at >= datetime.fromisoformat(from_date)
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid from_date")

    if to_date:
        try:
            end = datetime.fromisoformat(to_date) + timedelta(days=1)
            resume_query = resume_query.filter(models.Resume.created_at < end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid to_date")

    resume_rows = resume_query.order_by(models.Resume.updated_at.desc()).all()

    return {
        "overview": {
            "users": users_count,
            "resumes": resumes_count,
            "resumes_this_week": recent_resumes,
            "active_users": active_users,
            "template_usage": {name: count for name, count in usage_rows},
        },
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "is_admin": bool(u.is_admin),
                "created_at": u.created_at,
                "resume_count": int(u.resume_count or 0),
                "is_active": bool(u.is_active),
            }
            for u in user_rows
        ],
        "resumes": [
            {
                "id": r.id,
                "name": r.name,
                "template": r.template,
                "color": r.color,
                "owner_id": r.owner_id,
                "owner_name": r.owner_name,
                "owner_email": r.owner_email,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
            }
            for r in resume_rows
        ],
    }

@router.get("/overview")
def overview(admin: models.User = Depends(auth.get_current_admin), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    week_start = now - timedelta(days=7)
    users = db.query(func.count(models.User.id)).scalar() or 0
    resumes = db.query(func.count(models.Resume.id)).scalar() or 0
    recent_resumes = db.query(func.count(models.Resume.id)).filter(models.Resume.created_at >= week_start).scalar() or 0
    active_users = db.query(func.count(models.User.id)).filter(models.User.is_active == 1).scalar() or 0
    usage = db.query(models.Resume.template, func.count(models.Resume.id)).group_by(models.Resume.template).all()
    return {
        "users": users,
        "resumes": resumes,
        "resumes_this_week": recent_resumes,
        "active_users": active_users,
        "template_usage": {name: count for name, count in usage},
    }

@router.get("/users")
def users(admin: models.User = Depends(auth.get_current_admin), db: Session = Depends(get_db)):
    rows = (
        db.query(
            models.User.id, models.User.name, models.User.email,
            models.User.is_admin, models.User.created_at, models.User.is_active,
            func.count(models.Resume.id).label("resume_count"),
        )
        .outerjoin(models.Resume, models.Resume.owner_id == models.User.id)
        .group_by(
            models.User.id, models.User.name, models.User.email,
            models.User.is_admin, models.User.created_at, models.User.is_active,
        )
        .order_by(models.User.created_at.desc())
        .all()
    )
    return [
        {
            "id": u.id, "name": u.name, "email": u.email,
            "is_admin": bool(u.is_admin), "created_at": u.created_at,
            "resume_count": int(u.resume_count or 0), "is_active": bool(u.is_active),
        }
        for u in rows
    ]

@router.get("/resumes")
def resumes(
    q: str = Query("", max_length=120),
    from_date: str = Query("", max_length=20),
    to_date: str = Query("", max_length=20),
    admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db),
):
    query = (
        db.query(
            models.Resume.id, models.Resume.name, models.Resume.template,
            models.Resume.color, models.Resume.owner_id,
            models.Resume.created_at, models.Resume.updated_at,
            models.User.name.label("owner_name"),
            models.User.email.label("owner_email"),
        )
        .join(models.User, models.User.id == models.Resume.owner_id)
    )
    term = q.strip()
    if term:
        like = f"%{term}%"
        query = query.filter(or_(
            models.Resume.name.ilike(like),
            models.User.name.ilike(like),
            models.User.email.ilike(like),
        ))
    if from_date:
        try:
            query = query.filter(models.Resume.created_at >= datetime.fromisoformat(from_date))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid from_date")
    if to_date:
        try:
            query = query.filter(models.Resume.created_at < datetime.fromisoformat(to_date) + timedelta(days=1))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid to_date")
    rows = query.order_by(models.Resume.updated_at.desc()).all()
    return [
        {
            "id": r.id, "name": r.name, "template": r.template, "color": r.color,
            "owner_id": r.owner_id, "owner_name": r.owner_name,
            "owner_email": r.owner_email, "created_at": r.created_at,
            "updated_at": r.updated_at,
        }
        for r in rows
    ]

@router.get("/resumes/{resume_id}")
def get_resume(resume_id: int, admin: models.User = Depends(auth.get_current_admin), db: Session = Depends(get_db)):
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return {
        "id": resume.id, "name": resume.name, "template": resume.template,
        "color": resume.color, "personal_info": resume.personal_info or {},
        "education": resume.education or [], "experience": resume.experience or [],
        "skills": resume.skills or [], "projects": resume.projects or [],
        "section_order": resume.section_order or ["summary", "experience", "education", "skills", "projects"],
        "created_at": resume.created_at, "updated_at": resume.updated_at,
        "owner_id": resume.owner_id, "owner_name": resume.owner.name,
        "owner_email": resume.owner.email,
    }

@router.delete("/resumes/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(resume_id: int, admin: models.User = Depends(auth.get_current_admin), db: Session = Depends(get_db)):
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    db.delete(resume)
    db.commit()
    return None

@router.patch("/users/{user_id}/status")
def set_user_status(
    user_id: int, active: bool,
    admin: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(get_db),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own administrator account")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = 1 if active else 0
    db.commit()
    return {"id": user.id, "is_active": bool(user.is_active)}

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, admin: models.User = Depends(auth.get_current_admin), db: Session = Depends(get_db)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own administrator account")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return None
