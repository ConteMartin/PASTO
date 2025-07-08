from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo import MongoClient
from pydantic import BaseModel, Field
from typing import Optional, List
import os
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
from enum import Enum

# Configuración de la aplicación
app = FastAPI(title="PASTO! API", version="1.0.0")

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de la base de datos
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client.pasto_db

# Configuración JWT
JWT_SECRET = os.environ.get('JWT_SECRET', 'pasto_secret_key_2024')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Security
security = HTTPBearer()

# Enums
class UserRole(str, Enum):
    CLIENT = "client"
    GARDENER = "gardener"

class ServiceType(str, Enum):
    GRASS_CUTTING = "grass_cutting"
    PRUNING = "pruning"
    CLEANING = "cleaning"
    MAINTENANCE = "maintenance"

class ServiceStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PruningDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

# Modelos Pydantic
class UserRegistration(BaseModel):
    email: str
    password: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    user_id: str
    email: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    created_at: datetime
    is_active: bool = True

class GardenerProfile(BaseModel):
    user_id: str
    tools: List[str] = []
    coverage_areas: List[str] = []
    base_rates: dict = {}
    availability: dict = {}
    is_available: bool = True
    rating: float = 0.0
    completed_jobs: int = 0

class ServiceRequest(BaseModel):
    client_id: str
    service_type: ServiceType
    address: str
    latitude: float
    longitude: float
    terrain_width: float
    terrain_length: float
    images: List[str] = []
    pruning_difficulty: Optional[PruningDifficulty] = None
    scheduled_date: Optional[datetime] = None
    is_immediate: bool = True
    estimated_price: Optional[float] = None
    estimated_duration: Optional[int] = None
    notes: Optional[str] = None

class ServiceResponse(BaseModel):
    service_id: str
    client_id: str
    gardener_id: Optional[str] = None
    service_type: ServiceType
    address: str
    latitude: float
    longitude: float
    terrain_width: float
    terrain_length: float
    images: List[str] = []
    pruning_difficulty: Optional[PruningDifficulty] = None
    scheduled_date: Optional[datetime] = None
    is_immediate: bool = True
    estimated_price: Optional[float] = None
    estimated_duration: Optional[int] = None
    status: ServiceStatus = ServiceStatus.PENDING
    created_at: datetime
    updated_at: datetime
    notes: Optional[str] = None

# Funciones de utilidad
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user = db.users.find_one({"user_id": user_id})
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

def calculate_service_price(service_type: ServiceType, terrain_width: float, terrain_length: float, 
                          pruning_difficulty: Optional[PruningDifficulty] = None) -> dict:
    """Calcular precio estimado y duración del servicio"""
    area = terrain_width * terrain_length
    
    # Precios base por tipo de servicio (en pesos argentinos)
    base_prices = {
        ServiceType.GRASS_CUTTING: 500,
        ServiceType.PRUNING: 800,
        ServiceType.CLEANING: 400,
        ServiceType.MAINTENANCE: 1000
    }
    
    # Duración base en minutos
    base_duration = {
        ServiceType.GRASS_CUTTING: 30,
        ServiceType.PRUNING: 45,
        ServiceType.CLEANING: 60,
        ServiceType.MAINTENANCE: 90
    }
    
    base_price = base_prices.get(service_type, 500)
    duration = base_duration.get(service_type, 30)
    
    # Ajustar por área
    price_per_m2 = base_price / 100  # Precio por metro cuadrado
    estimated_price = base_price + (area * price_per_m2)
    
    # Ajustar duración por área
    duration_per_m2 = duration / 100
    estimated_duration = int(duration + (area * duration_per_m2))
    
    # Ajustar por dificultad de poda
    if service_type == ServiceType.PRUNING and pruning_difficulty:
        difficulty_multiplier = {
            PruningDifficulty.EASY: 1.0,
            PruningDifficulty.MEDIUM: 1.3,
            PruningDifficulty.HARD: 1.6
        }
        multiplier = difficulty_multiplier.get(pruning_difficulty, 1.0)
        estimated_price *= multiplier
        estimated_duration = int(estimated_duration * multiplier)
    
    return {
        "estimated_price": round(estimated_price, 2),
        "estimated_duration": estimated_duration,
        "area_calculated": area
    }

# Rutas de API

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "PASTO! API está funcionando correctamente"}

@app.post("/api/auth/register")
async def register_user(user_data: UserRegistration):
    # Verificar si el usuario ya existe
    existing_user = db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Crear nuevo usuario
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "password": hashed_password,
        "full_name": user_data.full_name,
        "role": user_data.role,
        "phone": user_data.phone,
        "created_at": datetime.utcnow(),
        "is_active": True
    }
    
    db.users.insert_one(user_doc)
    
    # Si es jardinero, crear perfil de jardinero
    if user_data.role == UserRole.GARDENER:
        gardener_doc = {
            "user_id": user_id,
            "tools": [],
            "coverage_areas": [],
            "base_rates": {},
            "availability": {},
            "is_available": True,
            "rating": 0.0,
            "completed_jobs": 0,
            "created_at": datetime.utcnow()
        }
        db.gardeners.insert_one(gardener_doc)
    
    # Crear token de acceso
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserProfile(
            user_id=user_id,
            email=user_data.email,
            full_name=user_data.full_name,
            role=user_data.role,
            phone=user_data.phone,
            created_at=datetime.utcnow(),
            is_active=True
        )
    }

@app.post("/api/auth/login")
async def login_user(user_data: UserLogin):
    user = db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    access_token = create_access_token(data={"sub": user["user_id"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserProfile(
            user_id=user["user_id"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            phone=user.get("phone"),
            created_at=user["created_at"],
            is_active=user["is_active"]
        )
    }

@app.get("/api/auth/me")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return UserProfile(
        user_id=current_user["user_id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        phone=current_user.get("phone"),
        created_at=current_user["created_at"],
        is_active=current_user["is_active"]
    )

@app.post("/api/services/estimate")
async def estimate_service_price(
    service_type: ServiceType,
    terrain_width: float,
    terrain_length: float,
    pruning_difficulty: Optional[PruningDifficulty] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != UserRole.CLIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los clientes pueden solicitar estimaciones"
        )
    
    estimation = calculate_service_price(service_type, terrain_width, terrain_length, pruning_difficulty)
    
    return {
        "service_type": service_type,
        "terrain_area": estimation["area_calculated"],
        "estimated_price": estimation["estimated_price"],
        "estimated_duration": estimation["estimated_duration"],
        "currency": "ARS"
    }

@app.post("/api/services/request")
async def create_service_request(
    service_data: ServiceRequest,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != UserRole.CLIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los clientes pueden solicitar servicios"
        )
    
    # Calcular precio y duración
    estimation = calculate_service_price(
        service_data.service_type,
        service_data.terrain_width,
        service_data.terrain_length,
        service_data.pruning_difficulty
    )
    
    service_id = str(uuid.uuid4())
    service_doc = {
        "service_id": service_id,
        "client_id": current_user["user_id"],
        "gardener_id": None,
        "service_type": service_data.service_type,
        "address": service_data.address,
        "latitude": service_data.latitude,
        "longitude": service_data.longitude,
        "terrain_width": service_data.terrain_width,
        "terrain_length": service_data.terrain_length,
        "images": service_data.images,
        "pruning_difficulty": service_data.pruning_difficulty,
        "scheduled_date": service_data.scheduled_date,
        "is_immediate": service_data.is_immediate,
        "estimated_price": estimation["estimated_price"],
        "estimated_duration": estimation["estimated_duration"],
        "status": ServiceStatus.PENDING,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "notes": service_data.notes
    }
    
    db.services.insert_one(service_doc)
    
    return ServiceResponse(**service_doc)

@app.get("/api/services/available")
async def get_available_services(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.GARDENER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los jardineros pueden ver servicios disponibles"
        )
    
    services = list(db.services.find({"status": ServiceStatus.PENDING}))
    
    return [ServiceResponse(**service) for service in services]

@app.get("/api/services/my-requests")
async def get_my_service_requests(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.CLIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los clientes pueden ver sus solicitudes"
        )
    
    services = list(db.services.find({"client_id": current_user["user_id"]}))
    
    return [ServiceResponse(**service) for service in services]

@app.post("/api/services/{service_id}/accept")
async def accept_service(service_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.GARDENER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los jardineros pueden aceptar servicios"
        )
    
    service = db.services.find_one({"service_id": service_id})
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado"
        )
    
    if service["status"] != ServiceStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El servicio ya no está disponible"
        )
    
    # Actualizar servicio
    db.services.update_one(
        {"service_id": service_id},
        {
            "$set": {
                "gardener_id": current_user["user_id"],
                "status": ServiceStatus.ACCEPTED,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    updated_service = db.services.find_one({"service_id": service_id})
    return ServiceResponse(**updated_service)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)