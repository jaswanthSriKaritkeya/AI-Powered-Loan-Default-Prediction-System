from fastapi import APIRouter, HTTPException

from app.schemas import PANResponse, PANUpdateRequest
from app.services.pan_service import (
    get_customer_by_pan,
    update_customer_by_pan
)

router = APIRouter(prefix="/pan", tags=["PAN Provider"])


@router.get("/{pan}", response_model=PANResponse)
def get_pan_customer(pan: str):

    customer = get_customer_by_pan(pan)

    if customer is None:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return customer


@router.put("/{pan}", response_model=PANResponse)
def update_pan_customer(
    pan: str,
    request: PANUpdateRequest
):

    update_data = request.model_dump(
        exclude_none=True
    )

    customer = update_customer_by_pan(
        pan,
        update_data
    )

    if customer is None:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return customer