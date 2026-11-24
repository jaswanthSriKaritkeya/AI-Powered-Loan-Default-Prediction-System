from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from auth_router import get_current_user

from datetime import datetime, timezone
from io import BytesIO
from typing import Optional
import uuid

import pandas as pd
from bson import ObjectId

from database import (
    excel_imports_collection,
    excel_records_collection,
    customers_collection,
    loans_collection,
    risk_history_collection
)

from pan_service import fetch_pan_details
from predictor import loanPredict
from risk_buckets import risk_bucket
from shap_utils import get_shap_explainer
from loan_id_service import generate_loan_id


router = APIRouter(
    prefix="/excel",
    tags=["Excel"]
)


# =========================================================
# REQUIRED EXCEL COLUMNS
# =========================================================

REQUIRED_COLUMNS = {
    "pan",
    "loan_amount",
    "interest_rate",
    "loan_term",
    "loan_purpose",
    "has_cosigner"
}


# =========================================================
# MONGODB INDEXES
# =========================================================

excel_records_collection.create_index(
    [
        ("import_id", 1),
        ("row_number", 1)
    ],
    unique=True
)

excel_records_collection.create_index(
    "import_id"
)

excel_records_collection.create_index(
    "risk_bucket"
)

excel_records_collection.create_index(
    "pan"
)

excel_records_collection.create_index(
    "loan_id",
    sparse=True
)


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def is_missing(value):
    """
    Check whether an Excel cell is empty.
    """

    return (
        pd.isna(value)
        or str(value).strip() == ""
    )


def serialize_document(document):
    """
    Convert MongoDB ObjectId and datetime values
    into JSON-friendly values.
    """

    if not document:
        return document

    document = dict(document)

    if "_id" in document:
        document["_id"] = str(document["_id"])

    for key, value in document.items():

        if isinstance(value, datetime):
            document[key] = value.isoformat()

        elif isinstance(value, ObjectId):
            document[key] = str(value)

    return document


def validate_object_id(value):
    """
    Validate MongoDB ObjectId.
    """

    try:
        return ObjectId(value)

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid record ID"
        )


# =========================================================
# ROW VALIDATION
# =========================================================

def validate_row(row, row_number):

    errors = []

    # -----------------------------------------------------
    # PAN
    # -----------------------------------------------------

    pan = row.get("pan")

    if is_missing(pan):

        errors.append(
            "PAN is missing"
        )

        normalized_pan = None

    else:

        normalized_pan = (
            str(pan)
            .strip()
            .upper()
        )

    # -----------------------------------------------------
    # LOAN AMOUNT
    # -----------------------------------------------------

    loan_amount = row.get("loan_amount")

    if is_missing(loan_amount):

        errors.append(
            "Loan amount is missing"
        )

        normalized_loan_amount = None

    else:

        normalized_loan_amount = pd.to_numeric(
            loan_amount,
            errors="coerce"
        )

        if pd.isna(normalized_loan_amount):

            errors.append(
                "Loan amount must be numeric"
            )

        elif normalized_loan_amount <= 0:

            errors.append(
                "Loan amount must be greater than 0"
            )

    # -----------------------------------------------------
    # INTEREST RATE
    # -----------------------------------------------------

    interest_rate = row.get("interest_rate")

    if is_missing(interest_rate):

        errors.append(
            "Interest rate is missing"
        )

        normalized_interest_rate = None

    else:

        normalized_interest_rate = pd.to_numeric(
            interest_rate,
            errors="coerce"
        )

        if pd.isna(normalized_interest_rate):

            errors.append(
                "Interest rate must be numeric"
            )

        elif normalized_interest_rate < 0:

            errors.append(
                "Interest rate cannot be negative"
            )

    # -----------------------------------------------------
    # LOAN TERM
    # -----------------------------------------------------

    loan_term = row.get("loan_term")

    if is_missing(loan_term):

        errors.append(
            "Loan term is missing"
        )

        normalized_loan_term = None

    else:

        normalized_loan_term = pd.to_numeric(
            loan_term,
            errors="coerce"
        )

        if pd.isna(normalized_loan_term):

            errors.append(
                "Loan term must be numeric"
            )

        elif normalized_loan_term <= 0:

            errors.append(
                "Loan term must be greater than 0"
            )

    # -----------------------------------------------------
    # LOAN PURPOSE
    # -----------------------------------------------------

    loan_purpose = row.get("loan_purpose")

    if is_missing(loan_purpose):

        errors.append(
            "Loan purpose is missing"
        )

        normalized_loan_purpose = None

    else:

        normalized_loan_purpose = (
            str(loan_purpose)
            .strip()
        )

    # -----------------------------------------------------
    # CO-SIGNER
    # -----------------------------------------------------

    has_cosigner = row.get("has_cosigner")

    if is_missing(has_cosigner):

        errors.append(
            "Has cosigner is missing"
        )

        normalized_has_cosigner = None

    else:

        normalized_has_cosigner = (
            str(has_cosigner)
            .strip()
            .lower()
        )

        if normalized_has_cosigner not in {
            "yes",
            "no"
        }:

            errors.append(
                "Has cosigner must be Yes or No"
            )

        else:

            normalized_has_cosigner = (
                normalized_has_cosigner.capitalize()
            )

    # =====================================================
    # INVALID
    # =====================================================

    if errors:

        return {
            "row_number": row_number,
            "status": "invalid",
            "pan": normalized_pan,
            "errors": errors
        }

    # =====================================================
    # VALID
    # =====================================================

    return {
        "row_number": row_number,
        "status": "valid",

        "pan": normalized_pan,

        "loan_amount": float(
            normalized_loan_amount
        ),

        "interest_rate": float(
            normalized_interest_rate
        ),

        "loan_term": int(
            normalized_loan_term
        ),

        "loan_purpose": normalized_loan_purpose,

        "has_cosigner": normalized_has_cosigner,

        "errors": []
    }


# =========================================================
# BUILD ML LOAN DATA
# =========================================================

async def build_loan_data(record):

    pan = record["pan"]

    try:

        customer = await fetch_pan_details(
            pan
        )

    except Exception as e:

        return (
            None,
            f"Unable to fetch PAN details: {str(e)}"
        )

    if not customer:

        return (
            None,
            "PAN not found"
        )

    # -----------------------------------------------------
    # DATE OF BIRTH
    # -----------------------------------------------------

    try:

        dob = pd.to_datetime(
            customer["dob"],
            errors="raise"
        )

        today = pd.Timestamp.now().date()

        age = (
            today.year
            - dob.year
            - (
                (today.month, today.day)
                < (dob.month, dob.day)
            )
        )

    except Exception:

        return (
            None,
            "Customer has invalid or missing date of birth"
        )

    # -----------------------------------------------------
    # REQUIRED CUSTOMER FIELDS
    # -----------------------------------------------------

    required_customer_fields = [
        "income",
        "credit_score",
        "months_employed",
        "num_credit_lines",
        "dti_ratio",
        "education",
        "employment_type",
        "marital_status",
        "has_mortgage",
        "has_dependents"
    ]

    missing_fields = []

    for field in required_customer_fields:

        if field not in customer:

            missing_fields.append(field)

    if missing_fields:

        return (
            None,
            "Customer data missing fields: "
            + ", ".join(missing_fields)
        )

    # =====================================================
    # MODEL INPUT
    # =====================================================

    loan_data = {

        "Age": age,

        "Income": customer["income"],

        "LoanAmount": record["loan_amount"],

        "CreditScore": customer["credit_score"],

        "MonthsEmployed": customer["months_employed"],

        "NumCreditLines": customer["num_credit_lines"],

        "InterestRate": record["interest_rate"],

        "LoanTerm": record["loan_term"],

        "DTIRatio": customer["dti_ratio"],

        "Education": customer["education"],

        "EmploymentType": customer["employment_type"],

        "MaritalStatus": customer["marital_status"],

        "HasMortgage": customer["has_mortgage"],

        "HasDependents": customer["has_dependents"],

        "LoanPurpose": record["loan_purpose"],

        "HasCoSigner": record["has_cosigner"]
    }

    return (
        loan_data,
        None
    )


# =========================================================
# PROCESS ONE VALID RECORD
# =========================================================

async def process_record(record):

    loan_data, error = await build_loan_data(
        record
    )

    if error:

        record["status"] = "invalid"

        record["errors"].append(
            error
        )

        return record

    record["loan_data"] = loan_data

    # -----------------------------------------------------
    # ML PREDICTION
    # -----------------------------------------------------

    try:

        prediction_res = loanPredict(
            loan_data
        )

        probability = (
            prediction_res["probability"]
        )

        risk = risk_bucket(
            probablity=probability
        )

    except Exception as e:

        record["status"] = "invalid"

        record["errors"].append(
            f"Prediction failed: {str(e)}"
        )

        return record

    # -----------------------------------------------------
    # SHAP
    # -----------------------------------------------------

    try:

        explanations = get_shap_explainer(
            loan_data
        )

    except Exception as e:

        record["status"] = "invalid"

        record["errors"].append(
            f"SHAP explanation failed: {str(e)}"
        )

        return record

    # =====================================================
    # SAVE ANALYSIS RESULT IN RECORD
    # =====================================================

    record["prediction"] = (
        prediction_res["prediction"]
    )

    record["default_probability"] = (
        probability
    )

    record["risk_bucket"] = risk

    record["explanations"] = explanations

    # These are important for Excel workflow
    record["added_to_loan_list"] = False
    record["loan_id"] = None

    return record


# =========================================================
# UPLOAD EXCEL
# =========================================================

@router.post("/upload")
async def upload_excel(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):

    # =====================================================
    # FILE VALIDATION
    # =====================================================

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected"
        )

    filename = file.filename.lower()

    if not filename.endswith(
        (".xlsx", ".xls")
    ):

        raise HTTPException(
            status_code=400,
            detail="Only .xlsx and .xls Excel files are supported"
        )

    # =====================================================
    # READ FILE
    # =====================================================

    try:

        contents = await file.read()

        if not contents:

            raise HTTPException(
                status_code=400,
                detail="Uploaded Excel file is empty"
            )

        df = pd.read_excel(
            BytesIO(contents)
        )

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=f"Unable to read Excel file: {str(e)}"
        )

    # =====================================================
    # NORMALIZE COLUMNS
    # =====================================================

    df.columns = [
        str(column)
        .strip()
        .lower()
        for column in df.columns
    ]

    # =====================================================
    # REQUIRED COLUMNS
    # =====================================================

    missing_columns = (
        REQUIRED_COLUMNS
        - set(df.columns)
    )

    if missing_columns:

        raise HTTPException(
            status_code=400,
            detail={
                "message": "Required columns are missing",
                "missing_columns": sorted(
                    missing_columns
                )
            }
        )

    # =====================================================
    # REMOVE EMPTY ROWS
    # =====================================================

    df = df.dropna(
        how="all"
    )

    if df.empty:

        raise HTTPException(
            status_code=400,
            detail="Excel file contains no data rows"
        )

    # =====================================================
    # CREATE IMPORT ID
    # =====================================================

    import_id = str(
        uuid.uuid4()
    )

    now = datetime.now(
        timezone.utc
    )

    created_by = str(
        current_user["_id"]
    )

    # =====================================================
    # VALIDATE + PROCESS ROWS
    # =====================================================

    records = []

    for index, row in df.iterrows():

        # Excel:
        # row 1 = header
        # row 2 = first data row

        row_number = index + 2

        record = validate_row(
            row,
            row_number
        )

        record["import_id"] = import_id

        record["added_to_loan_list"] = False
        record["loan_id"] = None

        if record["status"] == "valid":

            record = await process_record(
                record
            )

        record["created_by"] = created_by
        record["created_at"] = now
        record["updated_at"] = now

        records.append(
            record
        )

    # =====================================================
    # FINAL COUNTS
    # =====================================================

    total_rows = len(records)

    valid_rows = sum(
        1
        for record in records
        if record["status"] == "valid"
    )

    invalid_rows = (
        total_rows
        - valid_rows
    )

    # =====================================================
    # RISK COUNTS
    # =====================================================

    risk_counts = {
        "Low Risk": 0,
        "Moderate Risk": 0,
        "High Risk": 0,
        "Critical": 0
    }

    for record in records:

        risk = record.get(
            "risk_bucket"
        )

        if risk in risk_counts:

            risk_counts[risk] += 1

    # =====================================================
    # SAVE IMPORT
    # =====================================================

    import_document = {

        "import_id": import_id,

        "filename": file.filename,

        "total_rows": total_rows,

        "valid_rows": valid_rows,

        "invalid_rows": invalid_rows,

        "risk_counts": risk_counts,

        "created_by": created_by,

        "created_at": now,

        "updated_at": now
    }

    excel_imports_collection.insert_one(
        import_document
    )

    # =====================================================
    # SAVE RECORDS
    # =====================================================

    if records:

        excel_records_collection.insert_many(
            records
        )

    # =====================================================
    # RESPONSE
    # =====================================================

    return {

        "message":
            "Excel analysis completed successfully",

        "import_id":
            import_id,

        "filename":
            file.filename,

        "total_rows":
            total_rows,

        "valid_rows":
            valid_rows,

        "invalid_rows":
            invalid_rows,

        "risk_counts":
            risk_counts,

        "records":
            [
                serialize_document(record)
                for record in records
            ]
    }


# =========================================================
# LIST EXCEL IMPORTS
# =========================================================

@router.get("/imports")
def list_excel_imports(
    current_user: dict = Depends(get_current_user)
):

    imports = excel_imports_collection.find(
        {
            "created_by":
                str(current_user["_id"])
        }
    ).sort(
        "created_at",
        -1
    )

    return {
        "imports": [
            serialize_document(item)
            for item in imports
        ]
    }


# =========================================================
# EXCEL DASHBOARD
# =========================================================

@router.get("/{import_id}/dashboard")
def get_excel_dashboard(
    import_id: str,
    current_user: dict = Depends(get_current_user)
):

    import_document = (
        excel_imports_collection.find_one(
            {
                "import_id": import_id,
                "created_by":
                    str(current_user["_id"])
            }
        )
    )

    if not import_document:

        raise HTTPException(
            status_code=404,
            detail="Excel import not found"
        )

    records = list(
        excel_records_collection.find(
            {
                "import_id": import_id
            }
        )
    )

    # =====================================================
    # COUNTS
    # =====================================================

    total_applicants = len(records)

    valid_applicants = sum(
        1
        for record in records
        if record.get("status") == "valid"
    )

    invalid_applicants = sum(
        1
        for record in records
        if record.get("status") == "invalid"
    )

    # =====================================================
    # RISK COUNTS
    # =====================================================

    risk_counts = {
        "Low Risk": 0,
        "Moderate Risk": 0,
        "High Risk": 0,
        "Critical": 0
    }

    for record in records:

        risk = record.get(
            "risk_bucket"
        )

        if risk in risk_counts:

            risk_counts[risk] += 1

    # =====================================================
    # ADDED TO LOAN LIST
    # =====================================================

    added_to_loan_list = sum(
        1
        for record in records
        if record.get(
            "added_to_loan_list",
            False
        )
    )

    return {

        "import_id":
            import_id,

        "filename":
            import_document.get(
                "filename"
            ),

        "total_applicants":
            total_applicants,

        "valid_applicants":
            valid_applicants,

        "invalid_applicants":
            invalid_applicants,

        "added_to_loan_list":
            added_to_loan_list,

        "not_added_to_loan_list":
            valid_applicants
            - added_to_loan_list,

        "risk_counts":
            risk_counts
    }


# =========================================================
# LIST EXCEL APPLICANTS
# =========================================================

@router.get("/{import_id}/records")
def list_excel_records(
    import_id: str,
    risk: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):

    # =====================================================
    # VERIFY IMPORT
    # =====================================================

    import_document = (
        excel_imports_collection.find_one(
            {
                "import_id": import_id,
                "created_by":
                    str(current_user["_id"])
            }
        )
    )

    if not import_document:

        raise HTTPException(
            status_code=404,
            detail="Excel import not found"
        )

    # =====================================================
    # QUERY
    # =====================================================

    query = {
        "import_id": import_id
    }

    if risk:

        allowed_risks = {
            "Low Risk",
            "Moderate Risk",
            "High Risk",
            "Critical"
        }

        if risk not in allowed_risks:

            raise HTTPException(
                status_code=400,
                detail="Invalid risk bucket"
            )

        query["risk_bucket"] = risk

    if status:

        if status not in {
            "valid",
            "invalid"
        }:

            raise HTTPException(
                status_code=400,
                detail="Status must be valid or invalid"
            )

        query["status"] = status

    # =====================================================
    # FETCH
    # =====================================================

    records = excel_records_collection.find(
        query
    ).sort(
        "row_number",
        1
    )

    return {

        "import_id":
            import_id,

        "records": [
            serialize_document(record)
            for record in records
        ]
    }


# =========================================================
# VIEW ONE EXCEL APPLICANT
# =========================================================

@router.get("/record/{record_id}")
def get_excel_record(
    record_id: str,
    current_user: dict = Depends(get_current_user)
):

    object_id = validate_object_id(
        record_id
    )

    record = excel_records_collection.find_one(
        {
            "_id": object_id,
            "created_by":
                str(current_user["_id"])
        }
    )

    if not record:

        raise HTTPException(
            status_code=404,
            detail="Excel applicant not found"
        )

    return {
        "record":
            serialize_document(record)
    }


# =========================================================
# ADD EXCEL APPLICANT TO MAIN LOAN LIST
# =========================================================

@router.post("/record/{record_id}/add-to-loan-list")
async def add_to_loan_list(
    record_id: str,
    current_user: dict = Depends(get_current_user)
):

    object_id = validate_object_id(
        record_id
    )

    # =====================================================
    # GET EXCEL RECORD
    # =====================================================

    record = excel_records_collection.find_one(
        {
            "_id": object_id,
            "created_by":
                str(current_user["_id"])
        }
    )

    if not record:

        raise HTTPException(
            status_code=404,
            detail="Excel applicant not found"
        )

    # =====================================================
    # MUST BE VALID
    # =====================================================

    if record.get("status") != "valid":

        raise HTTPException(
            status_code=400,
            detail="Invalid applicants cannot be added to the loan list"
        )

    # =====================================================
    # ALREADY ADDED
    # =====================================================

    if record.get(
        "added_to_loan_list",
        False
    ):

        return {

            "message":
                "Applicant is already in the loan list",

            "loan_id":
                record.get("loan_id"),

            "already_added":
                True
        }

    pan = (
        record.get("pan")
        or ""
    ).strip().upper()

    # =====================================================
    # FIND CUSTOMER
    # =====================================================

    customer = customers_collection.find_one(
        {
            "pan": pan
        }
    )

    # =====================================================
    # PAN CUSTOMER MAY NOT EXIST IN MAIN DB
    #
    # PAN simulator may have returned details during
    # analysis, but the customer may not yet exist in
    # customers collection.
    #
    # Fetch it again and create the customer only if your
    # PAN-fetch workflow normally persists customers.
    # =====================================================

    if not customer:

        try:

            customer_data = await fetch_pan_details(
                pan
            )

        except Exception as e:

            raise HTTPException(
                status_code=400,
                detail=f"Unable to fetch PAN details: {str(e)}"
            )

        if not customer_data:

            raise HTTPException(
                status_code=404,
                detail="Customer not found for this PAN"
            )

        # -------------------------------------------------
        # IMPORTANT
        #
        # Your existing /customers/fetch-pan endpoint
        # normally creates the customer.
        #
        # We do NOT blindly create a customer here because
        # the exact customer schema may be different.
        #
        # Try one more DB lookup.
        # -------------------------------------------------

        customer = customers_collection.find_one(
            {
                "pan": pan
            }
        )

        if not customer:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Customer is not registered in the main "
                    "customer collection. Fetch this PAN "
                    "using the normal customer PAN workflow first."
                )
            )

    # =====================================================
    # INTERNAL CUSTOMER ID
    # =====================================================

    customer_id = str(
        customer["_id"]
    )

    # =====================================================
    # REBUILD LOAN DATA
    #
    # We use the exact same fields used by /loans/
    # =====================================================

    loan_data = record.get(
        "loan_data"
    )

    if not loan_data:

        loan_data, error = await build_loan_data(
            record
        )

        if error:

            raise HTTPException(
                status_code=400,
                detail=error
            )

    # =====================================================
    # USE EXISTING ANALYSIS RESULT
    #
    # No need to run ML again unless the stored values
    # are missing.
    # =====================================================

    probability = record.get(
        "default_probability"
    )

    prediction = record.get(
        "prediction"
    )

    risk = record.get(
        "risk_bucket"
    )

    explanations = record.get(
        "explanations"
    )

    # -----------------------------------------------------
    # SAFETY FALLBACK
    # -----------------------------------------------------

    if (
        probability is None
        or prediction is None
        or risk is None
        or explanations is None
    ):

        try:

            prediction_res = loanPredict(
                loan_data
            )

            probability = (
                prediction_res["probability"]
            )

            prediction = (
                prediction_res["prediction"]
            )

            risk = risk_bucket(
                probablity=probability
            )

            explanations = get_shap_explainer(
                loan_data
            )

        except Exception as e:

            raise HTTPException(
                status_code=500,
                detail=f"Loan analysis failed: {str(e)}"
            )

    # =====================================================
    # GENERATE CANONICAL BUSINESS LOAN ID
    # =====================================================

    business_loan_id = generate_loan_id()

    now = datetime.now(
        timezone.utc
    )

    # =====================================================
    # CREATE MAIN LOAN
    # =====================================================

    loan = {

        "customer_id":
            customer_id,

        "loan_id":
            business_loan_id,

        "pan":
            pan,

        "loan_amount":
            record["loan_amount"],

        "interest_rate":
            record["interest_rate"],

        "loan_term":
            record["loan_term"],

        "loan_purpose":
            record["loan_purpose"],

        "has_cosigner":
            record["has_cosigner"],

        # -----------------------------------------------
        # EXISTING LOAN LIFECYCLE
        # -----------------------------------------------

        "status":
            "application",

        # -----------------------------------------------
        # INITIAL RISK
        # -----------------------------------------------

        "initial_risk":
            risk,

        "initial_default_probability":
            probability,

        # -----------------------------------------------
        # CURRENT RISK
        # -----------------------------------------------

        "current_risk":
            risk,

        "default_probability":
            probability,

        # -----------------------------------------------
        # CONTINUOUS MONITORING
        #
        # Application is NOT yet approved.
        # -----------------------------------------------

        "monitoring_status":
            "inactive",

        "last_assessment_date":
            None,

        "next_assessment_date":
            None,

        # -----------------------------------------------
        # SOURCE
        # -----------------------------------------------

        "source":
            "excel",

        "excel_import_id":
            record.get("import_id"),

        "excel_record_id":
            str(record["_id"]),

        # -----------------------------------------------
        # AUDIT
        # -----------------------------------------------

        "created_by":
            str(current_user["_id"]),

        "created_at":
            now,

        "updated_at":
            now
    }

    # =====================================================
    # INSERT LOAN
    # =====================================================

    try:

        result = loans_collection.insert_one(
            loan
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Unable to create loan: {str(e)}"
        )

    loan["_id"] = str(
        result.inserted_id
    )

    # =====================================================
    # CREATE INITIAL RISK HISTORY
    # =====================================================

    assessment = {

        "customer_id":
            customer_id,

        "pan":
            pan,

        # IMPORTANT:
        # This is the business Loan ID.
        #
        # Existing monitoring code should ideally use
        # the same convention.
        "loan_id":
            business_loan_id,

        "assessed_by":
            str(current_user["_id"]),

        "assessment_type":
            "initial",

        "source":
            "excel",

        "loan_data":
            loan_data,

        "prediction":
            prediction,

        "default_probability":
            probability,

        "risk_bucket":
            risk,

        "explanations":
            explanations,

        "created_at":
            now
    }

    risk_history_collection.insert_one(
        assessment
    )

    # =====================================================
    # UPDATE EXCEL RECORD
    # =====================================================

    update_result = (
        excel_records_collection.update_one(
            {
                "_id":
                    object_id,

                "added_to_loan_list":
                    {
                        "$ne": True
                    }
            },

            {
                "$set": {

                    "added_to_loan_list":
                        True,

                    "loan_id":
                        business_loan_id,

                    "added_at":
                        now,

                    "added_by":
                        str(current_user["_id"]),

                    "updated_at":
                        now
                }
            }
        )
    )

    # =====================================================
    # SAFETY CHECK
    #
    # This protects against a race where another request
    # added the same Excel applicant at the same time.
    # =====================================================

    if update_result.modified_count == 0:

        # Loan was already created by another request.
        # We should not leave a duplicate loan.
        loans_collection.delete_one(
            {
                "_id":
                    result.inserted_id
            }
        )

        risk_history_collection.delete_one(
            {
                "loan_id":
                    business_loan_id,

                "assessment_type":
                    "initial"
            }
        )

        existing_record = (
            excel_records_collection.find_one(
                {
                    "_id":
                        object_id
                }
            )
        )

        raise HTTPException(
            status_code=409,
            detail={
                "message":
                    "Applicant was already added to the loan list",

                "loan_id":
                    existing_record.get("loan_id")
                    if existing_record
                    else None
            }
        )

    # =====================================================
    # RESPONSE
    # =====================================================

    loan["created_at"] = (
        now.isoformat()
    )

    loan["updated_at"] = (
        now.isoformat()
    )

    return {

        "message":
            "Applicant added to loan list successfully",

        "already_added":
            False,

        "loan_id":
            business_loan_id,

        "loan":
            loan
    }


# =========================================================
# GET APPLICANTS BY RISK BUCKET
# =========================================================

@router.get("/{import_id}/risk/{risk_bucket_name}")
def get_applicants_by_risk(
    import_id: str,
    risk_bucket_name: str,
    current_user: dict = Depends(get_current_user)
):

    # =====================================================
    # VERIFY IMPORT
    # =====================================================

    import_document = (
        excel_imports_collection.find_one(
            {
                "import_id":
                    import_id,

                "created_by":
                    str(current_user["_id"])
            }
        )
    )

    if not import_document:

        raise HTTPException(
            status_code=404,
            detail="Excel import not found"
        )

    # =====================================================
    # VALIDATE RISK
    # =====================================================

    allowed_risks = {
        "Low Risk",
        "Moderate Risk",
        "High Risk",
        "Critical"
    }

    if risk_bucket_name not in allowed_risks:

        raise HTTPException(
            status_code=400,
            detail="Invalid risk bucket"
        )

    # =====================================================
    # FETCH APPLICANTS
    # =====================================================

    records = excel_records_collection.find(
        {
            "import_id":
                import_id,

            "status":
                "valid",

            "risk_bucket":
                risk_bucket_name
        }
    ).sort(
        "default_probability",
        -1
    )

    records = list(records)

    return {

        "import_id":
            import_id,

        "risk_bucket":
            risk_bucket_name,

        "count":
            len(records),

        "records": [
            serialize_document(record)
            for record in records
        ]
    }


# =========================================================
# DELETE / CANCEL EXCEL IMPORT
# =========================================================
#
# OPTIONAL ADMIN/AGENT CLEANUP
#
# We only allow deletion of the Excel analysis workspace.
# Existing loans created from it are NOT deleted.
# =========================================================

@router.delete("/{import_id}")
def delete_excel_import(
    import_id: str,
    current_user: dict = Depends(get_current_user)
):

    import_document = (
        excel_imports_collection.find_one(
            {
                "import_id":
                    import_id,

                "created_by":
                    str(current_user["_id"])
            }
        )
    )

    if not import_document:

        raise HTTPException(
            status_code=404,
            detail="Excel import not found"
        )

    # =====================================================
    # DELETE RECORDS
    # =====================================================

    result = excel_records_collection.delete_many(
        {
            "import_id":
                import_id
        }
    )

    # =====================================================
    # DELETE IMPORT
    # =====================================================

    excel_imports_collection.delete_one(
        {
            "_id":
                import_document["_id"]
        }
    )

    return {

        "message":
            "Excel analysis deleted successfully",

        "import_id":
            import_id,

        "deleted_records":
            result.deleted_count
    }