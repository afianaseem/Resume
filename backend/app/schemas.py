class ResumeListItem(BaseModel):
    """
    Dashboard data.

    The dashboard gets everything it needs in the original
    /resumes request instead of requesting every resume again.
    """

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    name: str

    template: str

    color: str

    personal_info: Dict[str, Any]

    education: List[Dict[str, Any]]

    experience: List[Dict[str, Any]]

    skills: List[str]

    projects: List[Dict[str, Any]]

    section_order: List[str] = [
        "summary",
        "experience",
        "education",
        "skills",
        "projects",
    ]

    created_at: datetime.datetime

    updated_at: datetime.datetime
