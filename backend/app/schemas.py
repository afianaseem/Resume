import datetime
import re
from typing import List, Optional, Any, Dict

from pydantic import BaseModel, EmailStr, ConfigDict, field_validator


# A short list of very common weak passwords. This is intentionally not
# exhaustive — it just blocks the most obvious throwaway passwords in
# addition to the structural strength checks below.
COMMON_WEAK_PASSWORDS = {
    "password", "password1", "password123", "12345678", "123456789",
    "qwerty123", "letmein", "iloveyou", "admin123", "welcome1",
    "abc12345", "111111111", "changeme", "qwertyuiop", "1q2w3e4r",
}

# Requires a proper domain with a TLD of at least 2 letters, e.g.
# name@example.com — rejects things like name@example or name@localhost.
EMAIL_TLD_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$")


def validate_strong_password(password: str) -> str:
    """Shared strength check used by both signup and password-change."""
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must include at least one lowercase letter")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must include at least one uppercase letter")
    if not re.search(r"\d", password):
        raise ValueError("Password must include at least one number")
    if not re.search(r"[!@#$%^&*()_\-+=\[\]{};:'\",.<>/?\\|`~]", password):
        raise ValueError("Password must include at least one special character")
    if password.lower() in COMMON_WEAK_PASSWORDS:
        raise ValueError("This password is too common. Please choose a stronger one")
    return password


def validate_email_has_tld(email: str) -> str:
    if not EMAIL_TLD_RE.match(email):
        raise ValueError(
            "Please enter a complete email address with a domain, e.g. name@example.com"
        )
    return email




PHONE_LENGTHS = {
    "+92": [10], "+1": [10], "+44": [10], "+91": [10], "+971": [9],
    "+966": [9], "+61": [9], "+49": [10, 11], "+33": [9], "+39": [9, 10],
    "+34": [9], "+31": [9], "+46": [9], "+41": [9], "+353": [9], "+65": [8],
    "+60": [9, 10], "+62": [9, 10, 11], "+63": [10], "+880": [10], "+94": [9],
    "+977": [10], "+86": [11], "+81": [9, 10], "+82": [9, 10], "+90": [10],
    "+20": [10], "+234": [10], "+254": [9], "+27": [9], "+55": [10, 11],
    "+52": [10], "+54": [10], "+7": [10], "+974": [8], "+965": [8],
    "+968": [8], "+973": [8], "+64": [8, 9], "+351": [9], "+48": [9],
    "+47": [8], "+45": [8], "+358": [9, 10], "+32": [9], "+43": [10, 11],
    "+30": [10], "+972": [9], "+66": [9], "+84": [9, 10],
}

def validate_personal_info_phone(info: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if info is None:
        return info
    phone = str(info.get("phone") or "").strip()
    if not phone:
        return info

    digits = re.sub(r"\D", "", phone)
    dial = str(info.get("country_dial") or "")
    if not dial:
        # Recover the country code from a stored international number.
        for candidate in sorted(PHONE_LENGTHS, key=len, reverse=True):
            if phone.startswith(candidate):
                dial = candidate
                break

    if dial in PHONE_LENGTHS:
        allowed = PHONE_LENGTHS[dial]
        if len(digits) - len(re.sub(r"\D", "", dial)) not in allowed:
            # digits may include the international dial in stored +XX format.
            local_digits = digits[len(re.sub(r"\D", "", dial)):] if digits.startswith(re.sub(r"\D", "", dial)) else digits
            if len(local_digits) not in allowed:
                raise ValueError(
                    f"Phone number must contain {allowed[0]} digits"
                    + (f" or {allowed[1]} digits" if len(allowed) > 1 else "")
                    + " after the country code."
                )
    else:
        # Unknown/manual country codes still get a safe international range.
        if not 7 <= len(digits) <= 15:
            raise ValueError("Phone number must contain between 7 and 15 digits.")

    return info

# ---------- Auth / User ----------

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    @classmethod
    def _name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Please enter your full name")
        return v

    @field_validator("email")
    @classmethod
    def _email_tld(cls, v: str) -> str:
        return validate_email_has_tld(str(v))

    @field_validator("password")
    @classmethod
    def _password_strength(cls, v: str) -> str:
        return validate_strong_password(v)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    profile_image: Optional[str] = None
    is_admin: bool = False
    is_active: bool = True
    created_at: datetime.datetime


class UserUpdateProfile(BaseModel):
    name: Optional[str] = None
    profile_image: Optional[str] = None


class UserUpdatePassword(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def _password_strength(cls, v: str) -> str:
        return validate_strong_password(v)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Resume ----------

class ResumeCreate(BaseModel):
    name: str
    template: Optional[str] = "classic"
    color: Optional[str] = "violet"
    personal_info: Optional[Dict[str, Any]] = {}
    education: Optional[List[Dict[str, Any]]] = []
    experience: Optional[List[Dict[str, Any]]] = []
    skills: Optional[List[str]] = []
    projects: Optional[List[Dict[str, Any]]] = []
    section_order: Optional[List[str]] = ["summary", "experience", "education", "skills", "projects"]

    @field_validator("template")
    @classmethod
    def _valid_template(cls, v):
        if v not in ALLOWED_TEMPLATES: raise ValueError("Invalid template")
        return v

    @field_validator("color")
    @classmethod
    def _valid_color(cls, v):
        if v not in ALLOWED_COLORS: raise ValueError("Invalid color")
        return v

    @field_validator("personal_info")
    @classmethod
    def _valid_phone(cls, v):
        return validate_personal_info_phone(v)


class ResumeUpdate(BaseModel):
    name: Optional[str] = None
    template: Optional[str] = None
    color: Optional[str] = None
    personal_info: Optional[Dict[str, Any]] = None
    education: Optional[List[Dict[str, Any]]] = None
    experience: Optional[List[Dict[str, Any]]] = None
    skills: Optional[List[str]] = None
    projects: Optional[List[Dict[str, Any]]] = None
    section_order: Optional[List[str]] = None

    @field_validator("template")
    @classmethod
    def _valid_template(cls, v):
        if v is not None and v not in ALLOWED_TEMPLATES: raise ValueError("Invalid template")
        return v

    @field_validator("color")
    @classmethod
    def _valid_color(cls, v):
        if v is not None and v not in ALLOWED_COLORS: raise ValueError("Invalid color")
        return v

    @field_validator("personal_info")
    @classmethod
    def _valid_phone(cls, v):
        return validate_personal_info_phone(v)


class ResumeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    template: str
    color: str
    personal_info: Dict[str, Any]
    education: List[Dict[str, Any]]
    experience: List[Dict[str, Any]]
    skills: List[str]
    projects: List[Dict[str, Any]]
    section_order: List[str] = ["summary", "experience", "education", "skills", "projects"]
    created_at: datetime.datetime
    updated_at: datetime.datetime


class ResumeListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    template: str
    color: str
    created_at: datetime.datetime
    updated_at: datetime.datetime


ALLOWED_TEMPLATES = {"classic", "modern", "minimal", "bold", "ats", "sidebar"}
ALLOWED_COLORS = {"violet", "blue", "green", "rose"}


# ---------- Share via email ----------

class ShareResumeRequest(BaseModel):
    email: EmailStr
    message: Optional[str] = None
    pdf_base64: Optional[str] = None

    @field_validator("pdf_base64")
    @classmethod
    def _pdf_size(cls, v):
        if v and len(v) > 20 * 1024 * 1024: raise ValueError("PDF is too large")
        return v

    @field_validator("email")
    @classmethod
    def _email_tld(cls, v: str) -> str:
        return validate_email_has_tld(str(v))


class ResumeVersionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    resume_id: int
    label: str
    template: str
    color: str
    personal_info: Dict[str, Any]
    education: List[Dict[str, Any]]
    experience: List[Dict[str, Any]]
    skills: List[str]
    projects: List[Dict[str, Any]]
    section_order: List[str]
    created_at: datetime.datetime
