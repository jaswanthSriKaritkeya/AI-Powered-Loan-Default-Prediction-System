from typing import Optional
from pydantic import BaseModel


class CustomerModel(BaseModel):
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