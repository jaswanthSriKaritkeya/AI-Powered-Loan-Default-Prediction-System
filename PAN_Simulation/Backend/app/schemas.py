from typing import Optional
from pydantic import BaseModel, Field


class PANResponse(BaseModel):
    pan: str
    name: str
    dob: str
    gender: Optional[str] = None

    phone: Optional[str] = None
    email: Optional[str] = None

    income: float
    credit_score: int
    months_employed: int
    num_credit_lines: int
    dti_ratio: float

    education: str
    employment_type: str
    marital_status: str

    has_mortgage: str
    has_dependents: str


class PANUpdateRequest(BaseModel):
    income: Optional[float] = Field(default=None, gt=0)
    credit_score: Optional[int] = Field(default=None, ge=300, le=900)
    months_employed: Optional[int] = Field(default=None, ge=0)
    num_credit_lines: Optional[int] = Field(default=None, ge=0)
    dti_ratio: Optional[float] = Field(default=None, ge=0, le=2)
    employment_type: Optional[str] = None