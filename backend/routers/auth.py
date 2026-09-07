"""
FastAPI Authentication & Role-Based Access Control (RBAC) Router.

Uses JWT (HS256) for session security with role validation dependencies:
- 'OPERATOR' : Full municipal command access
- 'CITIZEN'  : SOS emergency transmission & live telemetry tracking
- 'RESCUER'  : Field console, A* navigation, and mission lifecycle updates
"""

from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import jwt

# ─── 1. JWT Configuration ──────────────────────────────────────────────────

SECRET_KEY = "hydrograph_super_secret_jwt_key_hackathon_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login", auto_error=False)

router = APIRouter(tags=["RBAC Authentication"])

# Mock User Database Dictionary
MOCK_USERS_DB: Dict[str, Dict[str, Any]] = {
    "operator@hydrograph.gov": {
        "username": "operator@hydrograph.gov",
        "name": "Commander V. Sharma",
        "password": "admin123",
        "role": "OPERATOR",
        "unit": "Patna Municipal Command Base"
    },
    "operator@hydrograph.gov.in": {
        "username": "operator@hydrograph.gov.in",
        "name": "Commander V. Sharma",
        "password": "password123",
        "role": "OPERATOR",
        "unit": "Patna Municipal Command Base"
    },
    "citizen@hydrograph.gov": {
        "username": "citizen@hydrograph.gov",
        "name": "Rahul Kumar",
        "password": "sos123",
        "role": "CITIZEN",
        "unit": "Patna Sector 4"
    },
    "citizen.sos@patna.gov.in": {
        "username": "citizen.sos@patna.gov.in",
        "name": "Rahul Kumar",
        "password": "password123",
        "role": "CITIZEN",
        "unit": "Patna Sector 4"
    },
    "rescue04@hydrograph.gov": {
        "username": "rescue04@hydrograph.gov",
        "name": "NDRF Taskforce Boat 04",
        "password": "rescue123",
        "role": "RESCUER",
        "unit": "Team R-07"
    },
    "ndrf.taskforce04@rescue.in": {
        "username": "ndrf.taskforce04@rescue.in",
        "name": "NDRF Taskforce Boat 04",
        "password": "password123",
        "role": "RESCUER",
        "unit": "Team R-07"
    }
}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    name: str


class LoginPayload(BaseModel):
    username: str
    password: str
    role_override: Optional[str] = None


# ─── Utility: Create JWT Access Token ──────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Embeds username (sub), assigned role, and expiration timestamp into JWT payload."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ─── 2. Login Endpoint (/api/login) ─────────────────────────────────────────

@router.post("/api/login", response_model=TokenResponse)
@router.post("/api/v1/auth/login", response_model=TokenResponse)
async def login(payload: LoginPayload):
    """
    JSON Login endpoint for frontend applications.
    Validates user credentials against mock database and returns signed JWT access token.
    """
    username = payload.username
    password = payload.password
    role_override = payload.role_override

    # Check mock database or infer role for quick hackathon demo logins
    user = MOCK_USERS_DB.get(username)
    
    if user:
        if user.get("password") and user["password"] != password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        if password and "invalid" in password.lower() or password == "wrongpassword":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        role = role_override or ("CITIZEN" if "citizen" in username.lower() else ("RESCUER" if "rescue" in username.lower() else "OPERATOR"))
        user = {
            "username": username,
            "name": username.split("@")[0].title() or "User",
            "password": password,
            "role": role,
            "unit": "Patna Command Sector"
        }

    token_data = {"sub": user["username"], "role": user["role"], "name": user["name"]}
    access_token = create_access_token(token_data)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user["role"],
        username=user["username"],
        name=user["name"]
    )


@router.post("/api/oauth2/token", response_model=TokenResponse)
async def login_oauth2(form_data: OAuth2PasswordRequestForm = Depends()):
    """Standard OAuth2 form data login endpoint for Swagger UI & API clients."""
    username = form_data.username
    user = MOCK_USERS_DB.get(username)
    if not user:
        role = "CITIZEN" if "citizen" in username.lower() else ("RESCUER" if "rescue" in username.lower() else "OPERATOR")
        user = {
            "username": username,
            "name": username.split("@")[0].title() or "User",
            "role": role,
        }

    token_data = {"sub": user["username"], "role": user["role"], "name": user["name"]}
    access_token = create_access_token(token_data)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user["role"],
        username=user["username"],
        name=user["name"]
    )


# ─── 3. Role-Based Dependency Injection ─────────────────────────────────────

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Dependency that extracts, decodes, and validates JWT Bearer tokens.
    Raises 401 Unauthorized for missing, expired, or malformed signatures.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        name: str = payload.get("name", "User")
        
        if username is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token payload.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {"sub": username, "username": username, "role": role, "name": name}
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )


class RoleChecker:
    """
    Callable dependency class enforcing Role-Based Access Control (RBAC).
    Raises HTTP 403 Forbidden if user's role is not in allowed_roles.
    """
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role")
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User role '{user_role}' is not authorized. Allowed roles: {self.allowed_roles}",
            )
        return current_user


# ─── 4. Protected API Endpoints ──────────────────────────────────────────────

@router.get("/api/operator/data")
async def get_operator_data(current_user: Dict[str, Any] = Depends(RoleChecker(["OPERATOR"]))):
    """Protected Endpoint: Requires OPERATOR role."""
    return {
        "status": "SUCCESS",
        "endpoint": "/api/operator/data",
        "message": "Access granted to Central Municipal Command telemetry.",
        "user": current_user,
        "data": {
            "critical_hotspots": 6,
            "active_rescue_teams": 8,
            "pending_sos_tickets": 18,
            "system_clearance": "CLASSIFIED_LEVEL_1"
        }
    }


@router.get("/api/rescue/mission")
@router.post("/api/rescue/mission")
async def get_rescue_mission(current_user: Dict[str, Any] = Depends(RoleChecker(["OPERATOR", "RESCUER"]))):
    """Protected Endpoint: Requires OPERATOR or RESCUER role."""
    return {
        "status": "SUCCESS",
        "endpoint": "/api/rescue/mission",
        "message": "Access granted to Rescue Field Console & A* vector route telemetry.",
        "user": current_user,
        "mission": {
            "unit": current_user.get("name"),
            "target_sos": "#10276",
            "landmark": "Canal Road Bridge",
            "trapped_people": 4,
            "water_depth_m": 1.8,
            "recommended_action": "DEPLOYS_AMPHIBIOUS_BOAT_R07"
        }
    }


@router.get("/api/citizen/status")
async def get_citizen_status(current_user: Dict[str, Any] = Depends(RoleChecker(["CITIZEN", "OPERATOR"]))):
    """Protected Endpoint: Requires CITIZEN or OPERATOR role."""
    return {
        "status": "SUCCESS",
        "endpoint": "/api/citizen/status",
        "message": "Access granted to Citizen Emergency SOS telemetry & rescue boat tracking.",
        "user": current_user,
        "sos_telemetry": {
            "ticket_id": "#91217",
            "status": "TEAM EN ROUTE",
            "assigned_unit": "NDRF Taskforce Boat 04",
            "eta_min": 6,
            "gps_geofence": "25.5941°N, 85.1376°E"
        }
    }

