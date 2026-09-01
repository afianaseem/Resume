from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.exc import (
    IntegrityError,
    SQLAlchemyError,
)

from sqlalchemy.orm import Session

from .. import models, schemas, auth

from ..database import get_db


router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


# ---------------------------------------------------------
# SIGNUP
# ---------------------------------------------------------

@router.post(
    "/signup",
    response_model=schemas.Token,
    status_code=status.HTTP_201_CREATED,
)
def signup(
    payload: schemas.UserSignup,
    db: Session = Depends(get_db),
):

    try:

        existing = (
            db.query(models.User)
            .filter(
                models.User.email == payload.email
            )
            .first()
        )

        if existing:

            raise HTTPException(
                status_code=400,
                detail=(
                    "An account with this email "
                    "already exists"
                ),
            )

        user = models.User(
            name=payload.name,
            email=payload.email,
            hashed_password=auth.hash_password(
                payload.password
            ),
        )

        db.add(user)

        db.commit()

        db.refresh(user)

    except HTTPException:

        raise

    except IntegrityError as exc:

        db.rollback()

        print(
            f"[auth/signup] IntegrityError: {exc!r}"
        )

        raise HTTPException(
            status_code=400,
            detail=(
                "An account with this email "
                "already exists"
            ),
        )

    except SQLAlchemyError as exc:

        db.rollback()

        print(
            f"[auth/signup] Database error: {exc!r}"
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Database error while creating "
                "your account. Check the Supabase "
                "DATABASE_URL configuration."
            ),
        )

    except Exception as exc:

        db.rollback()

        print(
            f"[auth/signup] Unexpected error: {exc!r}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unexpected server error during signup."
            ),
        )


    # Create JWT only after database commit succeeds.
    token = auth.create_access_token(
        {
            "sub": str(user.id)
        }
    )

    return {
        "access_token": token,
        "user": user,
    }


# ---------------------------------------------------------
# LOGIN
# ---------------------------------------------------------

@router.post(
    "/login",
    response_model=schemas.Token,
)
def login(
    payload: schemas.UserLogin,
    db: Session = Depends(get_db),
):

    user = (
        db.query(models.User)
        .filter(
            models.User.email == payload.email
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
        )

    if not bool(user.is_active) and not bool(user.is_admin):
        raise HTTPException(
            status_code=403,
            detail="Your account is deleted. Please contact the administrator.",
        )

    if not auth.verify_password(
        payload.password,
        user.hashed_password,
    ):

        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
        )

    token = auth.create_access_token(
        {
            "sub": str(user.id)
        }
    )

    return {
        "access_token": token,
        "user": user,
    }


# ---------------------------------------------------------
# LOGOUT
# ---------------------------------------------------------

@router.post("/logout")
def logout():

    return {
        "message": "Logged out successfully"
    }


# ---------------------------------------------------------
# CURRENT USER
# ---------------------------------------------------------

@router.get(
    "/me",
    response_model=schemas.UserOut,
)
def get_me(
    current_user: models.User = Depends(
        auth.get_current_user
    ),
):

    return current_user


# ---------------------------------------------------------
# UPDATE PROFILE
# ---------------------------------------------------------

@router.put(
    "/me",
    response_model=schemas.UserOut,
)
def update_profile(
    payload: schemas.UserUpdateProfile,
    current_user: models.User = Depends(
        auth.get_current_user
    ),
    db: Session = Depends(get_db),
):

    if payload.name is not None:
        current_user.name = payload.name

    if payload.profile_image is not None:
        current_user.profile_image = (
            payload.profile_image
        )

    db.commit()

    db.refresh(current_user)

    return current_user


# ---------------------------------------------------------
# UPDATE PASSWORD
# ---------------------------------------------------------

@router.put("/me/password")
def update_password(
    payload: schemas.UserUpdatePassword,
    current_user: models.User = Depends(
        auth.get_current_user
    ),
    db: Session = Depends(get_db),
):

    if not auth.verify_password(
        payload.current_password,
        current_user.hashed_password,
    ):

        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect",
        )

    current_user.hashed_password = (
        auth.hash_password(
            payload.new_password
        )
    )

    db.commit()

    return {
        "message": "Password updated successfully"
    }