from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from database import users_collection
from auth_router import get_current_admin
from agent_service import create_agent


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