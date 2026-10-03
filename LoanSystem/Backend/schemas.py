from pydantic import BaseModel


class LoanRequest(BaseModel):
    Age: int
    Income: int
    LoanAmount: int
    CreditScore: int
    MonthsEmployed: int
    NumCreditLines: int
    InterestRate: float
    LoanTerm: int
    DTIRatio: float

    Education: str
    EmploymentType: str
    MaritalStatus: str
    HasMortgage: str
    HasDependents: str
    LoanPurpose: str
    HasCoSigner: str

class LifecycleRequest(BaseModel):
    loan_data: LoanRequest
    months: int = 6
    scenario: str = "stable"

class LoanAssessmentRequest(BaseModel):
    LoanAmount: int
    InterestRate: float
    LoanTerm: int
    LoanPurpose: str
    HasCoSigner: str

