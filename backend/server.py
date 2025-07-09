from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from pymongo import MongoClient
from pydantic import BaseModel, Field
from typing import Optional, List
from authlib.integrations.starlette_client import OAuth
from twilio.rest import Client as TwilioClient
from twilio.base.exceptions import TwilioException
import os
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
from enum import Enum
import base64
import json
import re

# Configuración de la aplicación
app = FastAPI(title="PASTO! API", version="2.0.0")

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware para sesiones (necesario para OAuth)
app.add_middleware(SessionMiddleware, secret_key=os.environ.get('JWT_SECRET', 'pasto_secret_key_2024'))

# Configuración de OAuth
oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.environ.get('GOOGLE_CLIENT_ID'),
    client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# Configuración de Twilio (opcional para desarrollo local)
twilio_client = None
TWILIO_VERIFY_SERVICE_SID = os.environ.get('TWILIO_VERIFY_SERVICE_SID')

# Inicializar Twilio solo si las credenciales están disponibles
if os.environ.get('TWILIO_ACCOUNT_SID') and os.environ.get('TWILIO_AUTH_TOKEN'):
    try:
        twilio_client = TwilioClient(
            os.environ.get('TWILIO_ACCOUNT_SID'),
            os.environ.get('TWILIO_AUTH_TOKEN')
        )
    except Exception as e:
        print(f"Warning: Could not initialize Twilio client: {e}")
        twilio_client = None

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

# Crear directorio para uploads si no existe
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Enums
class UserRole(str, Enum):
    CLIENT = "client"
    GARDENER = "gardener"
    ADMIN = "admin"

class ServiceType(str, Enum):
    GRASS_CUTTING = "grass_cutting"
    PRUNING = "pruning"
    CLEANING = "cleaning"
    MAINTENANCE = "maintenance"

class ServiceStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    ON_WAY = "on_way"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PruningDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class NotificationType(str, Enum):
    SERVICE_ACCEPTED = "service_accepted"
    SERVICE_STARTED = "service_started"
    SERVICE_COMPLETED = "service_completed"
    NEW_SERVICE_AVAILABLE = "new_service_available"
    GARDENER_ON_WAY = "gardener_on_way"

class AuthProvider(str, Enum):
    EMAIL = "email"
    GOOGLE = "google"

# Modelos Pydantic
class UserRegistration(BaseModel):
    email: str
    password: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None

class GoogleAuthRequest(BaseModel):
    code: str
    role: UserRole

class PhoneVerificationRequest(BaseModel):
    phone_number: str

class PhoneVerificationCheck(BaseModel):
    phone_number: str
    code: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    user_id: str
    email: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    phone_verified: bool = False
    auth_provider: AuthProvider = AuthProvider.EMAIL
    google_id: Optional[str] = None
    created_at: datetime
    is_active: bool = True
    avatar_url: Optional[str] = None
    rating: float = 0.0
    total_ratings: int = 0

class GardenerProfile(BaseModel):
    user_id: str
    tools: List[str] = []
    coverage_areas: List[str] = []
    base_rates: dict = {}
    availability: dict = {}
    is_available: bool = True
    rating: float = 0.0
    completed_jobs: int = 0
    specialties: List[str] = []
    bio: Optional[str] = None
    years_experience: int = 0

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
    client_name: Optional[str] = None
    gardener_name: Optional[str] = None
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
    final_price: Optional[float] = None
    actual_duration: Optional[int] = None
    status: ServiceStatus = ServiceStatus.PENDING
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    client_rating: Optional[int] = None
    gardener_rating: Optional[int] = None
    client_review: Optional[str] = None
    gardener_review: Optional[str] = None

class RatingRequest(BaseModel):
    service_id: str
    rating: int = Field(ge=1, le=5)
    review: Optional[str] = None

class StatusUpdate(BaseModel):
    status: ServiceStatus
    notes: Optional[str] = None

class GardenerUpdate(BaseModel):
    tools: Optional[List[str]] = None
    coverage_areas: Optional[List[str]] = None
    base_rates: Optional[dict] = None
    availability: Optional[dict] = None
    is_available: Optional[bool] = None
    specialties: Optional[List[str]] = None
    bio: Optional[str] = None
    years_experience: Optional[int] = None

class Notification(BaseModel):
    notification_id: str
    user_id: str
    type: NotificationType
    title: str
    message: str
    data: dict = {}
    read: bool = False
    created_at: datetime

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

def send_notification(user_id: str, notification_type: NotificationType, title: str, message: str, data: dict = {}):
    """Enviar notificación a un usuario"""
    notification = {
        "notification_id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "data": data,
        "read": False,
        "created_at": datetime.utcnow()
    }
    db.notifications.insert_one(notification)
    return notification

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

def update_user_rating(user_id: str, new_rating: int):
    """Actualizar rating promedio del usuario"""
    user = db.users.find_one({"user_id": user_id})
    if user:
        current_rating = user.get("rating", 0.0)
        total_ratings = user.get("total_ratings", 0)
        
        # Calcular nuevo promedio
        new_total = total_ratings + 1
        new_average = ((current_rating * total_ratings) + new_rating) / new_total
        
        db.users.update_one(
            {"user_id": user_id},
            {"$set": {"rating": round(new_average, 1), "total_ratings": new_total}}
        )

def validate_phone_number(phone: str) -> bool:
    """Validar formato de número de teléfono E.164"""
    pattern = r'^\+[1-9]\d{1,14}$'
    return re.match(pattern, phone) is not None

def send_sms_verification(phone_number: str) -> dict:
    """Enviar código de verificación SMS"""
    if not validate_phone_number(phone_number):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de número de teléfono inválido. Use formato E.164 (+1234567890)"
        )
    
    if not TWILIO_VERIFY_SERVICE_SID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Servicio de verificación SMS no configurado"
        )
    
    try:
        verification = twilio_client.verify.services(TWILIO_VERIFY_SERVICE_SID).verifications.create(
            to=phone_number,
            channel='sms'
        )
        
        # Guardar intento de verificación en la base de datos
        db.phone_verifications.insert_one({
            "phone_number": phone_number,
            "status": verification.status,
            "created_at": datetime.utcnow(),
            "verified": False
        })
        
        return {"status": verification.status, "phone_number": phone_number}
    except TwilioException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al enviar SMS: {str(e)}"
        )

def verify_sms_code(phone_number: str, code: str) -> bool:
    """Verificar código SMS"""
    if not TWILIO_VERIFY_SERVICE_SID:
        return False
    
    try:
        check = twilio_client.verify.services(TWILIO_VERIFY_SERVICE_SID).verification_checks.create(
            to=phone_number,
            code=code
        )
        
        is_valid = check.status == "approved"
        
        # Actualizar estado de verificación
        if is_valid:
            db.phone_verifications.update_one(
                {"phone_number": phone_number, "verified": False},
                {"$set": {"verified": True, "verified_at": datetime.utcnow()}}
            )
            
            # Actualizar usuario si existe
            db.users.update_one(
                {"phone": phone_number},
                {"$set": {"phone_verified": True}}
            )
        
        return is_valid
    except TwilioException:
        return False

def create_or_update_user_from_google(google_user: dict, role: UserRole) -> dict:
    """Crear o actualizar usuario desde datos de Google"""
    email = google_user.get('email')
    google_id = google_user.get('sub')
    
    if not email or not google_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Datos de Google incompletos"
        )
    
    # Buscar usuario existente por email o google_id
    existing_user = db.users.find_one({
        "$or": [
            {"email": email},
            {"google_id": google_id}
        ]
    })
    
    if existing_user:
        # Actualizar datos de Google si no están presentes
        update_data = {}
        if not existing_user.get("google_id"):
            update_data["google_id"] = google_id
            update_data["auth_provider"] = AuthProvider.GOOGLE
        
        if not existing_user.get("avatar_url") and google_user.get("picture"):
            update_data["avatar_url"] = google_user.get("picture")
        
        if update_data:
            db.users.update_one(
                {"user_id": existing_user["user_id"]},
                {"$set": update_data}
            )
            existing_user.update(update_data)
        
        return existing_user
    else:
        # Crear nuevo usuario
        user_id = str(uuid.uuid4())
        user_doc = {
            "user_id": user_id,
            "email": email,
            "password": None,  # No password for Google users
            "full_name": google_user.get('name', ''),
            "role": role,
            "phone": None,
            "phone_verified": False,
            "auth_provider": AuthProvider.GOOGLE,
            "google_id": google_id,
            "created_at": datetime.utcnow(),
            "is_active": True,
            "avatar_url": google_user.get('picture'),
            "rating": 0.0,
            "total_ratings": 0
        }
        
        db.users.insert_one(user_doc)
        
        # Si es jardinero, crear perfil de jardinero
        if role == UserRole.GARDENER:
            gardener_doc = {
                "user_id": user_id,
                "tools": [],
                "coverage_areas": [],
                "base_rates": {},
                "availability": {},
                "is_available": True,
                "rating": 0.0,
                "completed_jobs": 0,
                "specialties": [],
                "bio": None,
                "years_experience": 0,
                "created_at": datetime.utcnow()
            }
            db.gardeners.insert_one(gardener_doc)
        
        return user_doc

# Rutas de API optimizadas

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "PASTO! API funcionando", "version": "2.1.0"}

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
        "phone_verified": False,
        "auth_provider": AuthProvider.EMAIL,
        "google_id": None,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "avatar_url": None,
        "rating": 0.0,
        "total_ratings": 0
    }
    
    db.users.insert_one(user_doc)
    
    # Si es jardinero, crear perfil básico
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
            "specialties": [],
            "bio": None,
            "years_experience": 0,
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
            phone_verified=False,
            auth_provider=AuthProvider.EMAIL,
            created_at=datetime.utcnow(),
            is_active=True
        )
    }

@app.post("/api/auth/login")
async def login_user(user_data: UserLogin):
    user = db.users.find_one({"email": user_data.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    # Verificar si el usuario usa autenticación con Google
    if user.get("auth_provider") == AuthProvider.GOOGLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este usuario debe iniciar sesión con Google"
        )
    
    # Verificar contraseña
    if not user.get("password") or not verify_password(user_data.password, user["password"]):
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
            phone_verified=user.get("phone_verified", False),
            auth_provider=user.get("auth_provider", AuthProvider.EMAIL),
            google_id=user.get("google_id"),
            created_at=user["created_at"],
            is_active=user["is_active"],
            avatar_url=user.get("avatar_url"),
            rating=user.get("rating", 0.0),
            total_ratings=user.get("total_ratings", 0)
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
        phone_verified=current_user.get("phone_verified", False),
        auth_provider=current_user.get("auth_provider", AuthProvider.EMAIL),
        google_id=current_user.get("google_id"),
        created_at=current_user["created_at"],
        is_active=current_user["is_active"],
        avatar_url=current_user.get("avatar_url"),
        rating=current_user.get("rating", 0.0),
        total_ratings=current_user.get("total_ratings", 0)
    )

@app.post("/api/auth/google/complete")
async def google_complete_auth(auth_data: GoogleAuthRequest):
    """Completar autenticación con Google (simplificado)"""
    try:
        # Simular datos de usuario de Google
        google_user = {
            "sub": "google_user_id_" + str(uuid.uuid4()),
            "email": "user@example.com",
            "name": "Usuario Google",
            "picture": "https://example.com/avatar.jpg"
        }
        
        user_doc = create_or_update_user_from_google(google_user, auth_data.role)
        access_token = create_access_token(data={"sub": user_doc["user_id"]})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserProfile(**user_doc)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error completando autenticación: {str(e)}"
        )

# Endpoints de servicios optimizados
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
        "client_name": current_user["full_name"],
        "gardener_name": None,
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
        "final_price": None,
        "actual_duration": None,
        "status": ServiceStatus.PENDING,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "started_at": None,
        "completed_at": None,
        "notes": service_data.notes,
        "client_rating": None,
        "gardener_rating": None,
        "client_review": None,
        "gardener_review": None
    }
    
    db.services.insert_one(service_doc)
    
    # Notificar solo a jardineros disponibles y activos
    available_gardeners = db.gardeners.find({"is_available": True}, {"user_id": 1}).limit(20)
    for gardener in available_gardeners:
        send_notification(
            gardener["user_id"],
            NotificationType.NEW_SERVICE_AVAILABLE,
            "¡Nuevo trabajo disponible!",
            f"Nuevo servicio de {service_data.service_type} en {service_data.address}",
            {"service_id": service_id}
        )
    
    return ServiceResponse(**service_doc)

@app.get("/api/services/available")
async def get_available_services(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.GARDENER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los jardineros pueden ver servicios disponibles"
        )
    
    # Optimizar query - solo servicios pendientes ordenados por fecha
    services = list(db.services.find(
        {"status": ServiceStatus.PENDING}
    ).sort("created_at", -1).limit(50))
    
    return [ServiceResponse(**service) for service in services]

@app.get("/api/services/my-requests")
async def get_my_service_requests(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.CLIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los clientes pueden ver sus solicitudes"
        )
    
    # Optimizar query - limitado a últimas 100 solicitudes
    services = list(db.services.find(
        {"client_id": current_user["user_id"]}
    ).sort("created_at", -1).limit(100))
    
    return [ServiceResponse(**service) for service in services]

@app.get("/api/services/my-jobs")
async def get_my_jobs(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.GARDENER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los jardineros pueden ver sus trabajos"
        )
    
    # Optimizar query - limitado a últimos 100 trabajos
    services = list(db.services.find(
        {"gardener_id": current_user["user_id"]}
    ).sort("created_at", -1).limit(100))
    
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
                "gardener_name": current_user["full_name"],
                "status": ServiceStatus.ACCEPTED,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Notificar al cliente
    send_notification(
        service["client_id"],
        NotificationType.SERVICE_ACCEPTED,
        "¡Servicio aceptado!",
        f"{current_user['full_name']} ha aceptado tu solicitud de servicio",
        {"service_id": service_id, "gardener_name": current_user["full_name"]}
    )
    
    updated_service = db.services.find_one({"service_id": service_id})
    return ServiceResponse(**updated_service)

@app.post("/api/services/{service_id}/update-status")
async def update_service_status(
    service_id: str,
    status_update: StatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    service = db.services.find_one({"service_id": service_id})
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado"
        )
    
    # Verificar permisos
    if current_user["role"] == UserRole.GARDENER and service["gardener_id"] != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar este servicio"
        )
    
    update_data = {
        "status": status_update.status,
        "updated_at": datetime.utcnow()
    }
    
    # Actualizar timestamps específicos
    if status_update.status == ServiceStatus.IN_PROGRESS:
        update_data["started_at"] = datetime.utcnow()
    elif status_update.status == ServiceStatus.COMPLETED:
        update_data["completed_at"] = datetime.utcnow()
    
    if status_update.notes:
        update_data["notes"] = status_update.notes
    
    db.services.update_one(
        {"service_id": service_id},
        {"$set": update_data}
    )
    
    # Notificaciones optimizadas
    notification_messages = {
        ServiceStatus.ON_WAY: "El jardinero está en camino",
        ServiceStatus.IN_PROGRESS: "El trabajo ha comenzado",
        ServiceStatus.COMPLETED: "El trabajo ha sido completado"
    }
    
    if status_update.status in notification_messages:
        send_notification(
            service["client_id"],
            NotificationType.SERVICE_STARTED if status_update.status == ServiceStatus.IN_PROGRESS else NotificationType.SERVICE_COMPLETED,
            "Actualización de servicio",
            notification_messages[status_update.status],
            {"service_id": service_id, "status": status_update.status}
        )
    
    updated_service = db.services.find_one({"service_id": service_id})
    return ServiceResponse(**updated_service)

@app.get("/api/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    # Optimizar query - solo últimas 50 notificaciones
    notifications = list(db.notifications.find(
        {"user_id": current_user["user_id"]}
    ).sort("created_at", -1).limit(50))
    
    return [Notification(**notification) for notification in notifications]

@app.post("/api/notifications/{notification_id}/read")
async def mark_notification_as_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = db.notifications.update_one(
        {"notification_id": notification_id, "user_id": current_user["user_id"]},
        {"$set": {"read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada"
        )
    
    return {"message": "Notificación marcada como leída"}

@app.post("/api/admin/create-admin")
async def create_admin():
    """Crear usuario administrador (solo para configuración inicial)"""
    admin_email = "admin@pasto.com"
    admin_password = "admin123"
    
    # Verificar si ya existe
    existing_admin = db.users.find_one({"email": admin_email})
    if existing_admin:
        return {"message": "El usuario administrador ya existe"}
    
    # Crear usuario administrador
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(admin_password)
    
    admin_doc = {
        "user_id": user_id,
        "email": admin_email,
        "password": hashed_password,
        "full_name": "Administrador PASTO",
        "role": UserRole.ADMIN,
        "phone": "+57123456789",
        "phone_verified": True,
        "auth_provider": AuthProvider.EMAIL,
        "google_id": None,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "avatar_url": None,
        "rating": 5.0,
        "total_ratings": 1
    }
    
    db.users.insert_one(admin_doc)
    
    return {
        "message": "Usuario administrador creado exitosamente",
        "email": admin_email,
        "password": admin_password,
        "user_id": user_id
    }

@app.get("/api/admin/users")
async def get_all_users(current_user: dict = Depends(get_current_user)):
    """Obtener todos los usuarios (solo admin)"""
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden ver todos los usuarios"
        )
    
    users = list(db.users.find({}, {"password": 0}))  # No incluir passwords
    
    # Convert MongoDB ObjectId to string
    for user in users:
        if "_id" in user:
            user["_id"] = str(user["_id"])
    
    return users

@app.get("/api/admin/services")
async def get_all_services(current_user: dict = Depends(get_current_user)):
    """Obtener todos los servicios (solo admin)"""
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden ver todos los servicios"
        )
    
    services = list(db.services.find({}))
    
    # Convert MongoDB ObjectId to string
    for service in services:
        if "_id" in service:
            service["_id"] = str(service["_id"])
    
    return services

@app.delete("/api/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Eliminar usuario (solo admin)"""
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden eliminar usuarios"
        )
    
    result = db.users.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return {"message": "Usuario eliminado exitosamente"}

@app.post("/api/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se permiten archivos de imagen"
        )
    
    # Generar nombre único para el archivo
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"{current_user['user_id']}_{uuid.uuid4()}.{file_extension}"
    file_path = f"uploads/{unique_filename}"
    
    # Guardar archivo
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Retornar URL del archivo
    return {"image_url": f"/uploads/{unique_filename}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)