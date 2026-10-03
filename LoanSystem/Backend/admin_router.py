from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from auth_router import get_current_admin
from agent_service import create_agent

from bson import ObjectId

from database import users_collection, customers_collection

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# =========================================================
# CREATE AGENT REQUEST
# =========================================================

class CreateAgentRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


# =========================================================
# CREATE AGENT
# =========================================================

@router.post("/agents")
def create_new_agent(
    request: CreateAgentRequest,
    admin: dict = Depends(get_current_admin)
):

    agent_id = create_agent(
        name=request.name,
        email=str(request.email),
        password=request.password
    )

    if agent_id is None:

        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists"
        )

    return {
        "message": "Agent created successfully",
        "agent_id": agent_id
    }


# =========================================================
# GET ALL AGENTS
# =========================================================

@router.get("/agents")
def get_all_agents(
    admin: dict = Depends(get_current_admin)
):

    agents = users_collection.find({
        "role": "agent"
    })

    result = []

    for agent in agents:

        result.append({
            "id": str(agent["_id"]),
            "name": agent["name"],
            "email": agent["email"],
            "role": agent["role"],
            "is_active": agent.get("is_active", False),
            "assigned_customers": len(
                agent.get("assigned_customers", [])
            )
        })

    return {
        "agents": result
    }


# =========================================================
# DEACTIVATE AGENT
# =========================================================

@router.put("/agents/{agent_id}/deactivate")
def deactivate_agent(
    agent_id: str,
    admin: dict = Depends(get_current_admin)
):

    from bson import ObjectId
    from bson.errors import InvalidId

    try:
        object_id = ObjectId(agent_id)

    except InvalidId:

        raise HTTPException(
            status_code=400,
            detail="Invalid agent ID"
        )

    result = users_collection.update_one(
        {
            "_id": object_id,
            "role": "agent"
        },
        {
            "$set": {
                "is_active": False
            }
        }
    )

    if result.matched_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Agent not found"
        )

    return {
        "message": "Agent deactivated successfully"
    }


# =========================================================
# ACTIVATE AGENT
# =========================================================

@router.put("/agents/{agent_id}/activate")
def activate_agent(
    agent_id: str,
    admin: dict = Depends(get_current_admin)
):

    from bson import ObjectId
    from bson.errors import InvalidId

    try:
        object_id = ObjectId(agent_id)

    except InvalidId:

        raise HTTPException(
            status_code=400,
            detail="Invalid agent ID"
        )

    result = users_collection.update_one(
        {
            "_id": object_id,
            "role": "agent"
        },
        {
            "$set": {
                "is_active": True
            }
        }
    )

    if result.matched_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Agent not found"
        )

    return {
        "message": "Agent activated successfully"
    }

@router.put("/agents/{agent_id}/assign-customer/{customer_id}")
def assign_customer_to_agent(
    agent_id: str,
    customer_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    # Validate IDs
    if not ObjectId.is_valid(agent_id):
        raise HTTPException(400, "Invalid agent ID")

    if not ObjectId.is_valid(customer_id):
        raise HTTPException(400, "Invalid customer ID")

    # Check agent exists and is active
    agent = users_collection.find_one({
        "_id": ObjectId(agent_id),
        "role": "agent",
        "is_active": True
    })

    if not agent:
        raise HTTPException(404, "Active agent not found")

    # Check customer exists
    customer = customers_collection.find_one({
        "_id": ObjectId(customer_id)
    })

    if not customer:
        raise HTTPException(404, "Customer not found")

    # Assign customer without creating duplicates
    users_collection.update_one(
        {"_id": ObjectId(agent_id)},
        {
            "$addToSet": {
                "assigned_customers": customer_id
            }
        }
    )

    return {
        "message": "Customer assigned to agent successfully",
        "agent_id": agent_id,
        "customer_id": customer_id
    }