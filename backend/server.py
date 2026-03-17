from fastapi import FastAPI, APIRouter, HTTPException, Response, Request, Cookie, Depends
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date, timedelta, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
import httpx
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# OpenAI Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== AUTH MODELS ====================

class User(BaseModel):
    user_id: str = Field(default_factory=lambda: f"user_{uuid.uuid4().hex[:12]}")
    email: str
    name: str
    picture: Optional[str] = None
    auth_type: str = "google"  # google or email
    password_hash: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    session_id: str = Field(default_factory=lambda: f"sess_{uuid.uuid4().hex}")
    user_id: str
    session_token: str = Field(default_factory=lambda: f"token_{uuid.uuid4().hex}")
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=7))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmailRegister(BaseModel):
    email: str
    password: str
    name: str

class EmailLogin(BaseModel):
    email: str
    password: str

class GoogleSessionRequest(BaseModel):
    session_id: str

# ==================== HABIT MODELS ====================

class Habit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    name: str
    category: str
    reminder_time: Optional[str] = None
    streak: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class HabitCreate(BaseModel):
    name: str
    category: str
    reminder_time: Optional[str] = None

class HabitLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    habit_id: str
    user_id: Optional[str] = None
    date: str
    done: bool
    logged_at: datetime = Field(default_factory=datetime.utcnow)

class HabitCheckIn(BaseModel):
    done: bool

class MoodEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    date: str
    mood: int
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MoodCreate(BaseModel):
    mood: int
    note: Optional[str] = None

class CoachMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    role: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CoachRequest(BaseModel):
    user_name: Optional[str] = "Utilisateur"

class ChatMessageRequest(BaseModel):
    message: str
    user_name: Optional[str] = "Utilisateur"

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    name: str = "Utilisateur"
    notification_time: str = "08:00"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    notification_time: Optional[str] = None

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request, session_token: Optional[str] = Cookie(None)) -> Optional[User]:
    """Get current user from session token (cookie or header)"""
    token = session_token
    
    # Try Authorization header as fallback
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        return None
    
    # Find session
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    # Get user
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    
    return User(**user_doc)

async def get_optional_user(request: Request, session_token: Optional[str] = Cookie(None)) -> Optional[User]:
    """Get current user if logged in, otherwise None"""
    return await get_current_user(request, session_token)

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register_email(data: EmailRegister, response: Response):
    """Register with email/password"""
    # Check if email exists
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    
    # Create user
    password_hash = pwd_context.hash(data.password)
    user = User(
        email=data.email,
        name=data.name,
        auth_type="email",
        password_hash=password_hash
    )
    await db.users.insert_one(user.dict())
    
    # Create session
    session = UserSession(user_id=user.user_id)
    await db.user_sessions.insert_one(session.dict())
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session.session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    logger.info(f"User registered: {user.email}")
    
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "session_token": session.session_token
    }

@api_router.post("/auth/login")
async def login_email(data: EmailLogin, response: Response):
    """Login with email/password"""
    user_doc = await db.users.find_one({"email": data.email, "auth_type": "email"}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if not pwd_context.verify(data.password, user_doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    # Create session
    session = UserSession(user_id=user_doc["user_id"])
    await db.user_sessions.insert_one(session.dict())
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session.session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    logger.info(f"User logged in: {user_doc['email']}")
    
    return {
        "user_id": user_doc["user_id"],
        "email": user_doc["email"],
        "name": user_doc["name"],
        "session_token": session.session_token
    }

@api_router.post("/auth/google/session")
async def google_auth_session(data: GoogleSessionRequest, response: Response):
    """Exchange Google OAuth session_id for session token"""
    try:
        # Call Emergent Auth API
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": data.session_id}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Session invalide")
            
            google_data = resp.json()
        
        # Check if user exists
        existing = await db.users.find_one({"email": google_data["email"]}, {"_id": 0})
        
        if existing:
            user_id = existing["user_id"]
            # Update user info
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"name": google_data["name"], "picture": google_data.get("picture")}}
            )
        else:
            # Create new user
            user = User(
                email=google_data["email"],
                name=google_data["name"],
                picture=google_data.get("picture"),
                auth_type="google"
            )
            await db.users.insert_one(user.dict())
            user_id = user.user_id
        
        # Create session
        session = UserSession(user_id=user_id)
        await db.user_sessions.insert_one(session.dict())
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session.session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7*24*60*60
        )
        
        logger.info(f"Google auth successful: {google_data['email']}")
        
        return {
            "user_id": user_id,
            "email": google_data["email"],
            "name": google_data["name"],
            "picture": google_data.get("picture"),
            "session_token": session.session_token
        }
        
    except httpx.HTTPError as e:
        logger.error(f"Google auth error: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur d'authentification Google")

@api_router.get("/auth/me")
async def get_me(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get current user info"""
    user = await get_current_user(request, session_token)
    if not user:
        raise HTTPException(status_code=401, detail="Non authentifié")
    
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "auth_type": user.auth_type
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, session_token: Optional[str] = Cookie(None)):
    """Logout user"""
    token = session_token
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Déconnexion réussie"}

# ==================== HABITS ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "CoachHabits API - Bienvenue!"}

@api_router.post("/habits", response_model=Habit)
async def create_habit(habit_data: HabitCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Créer une nouvelle habitude"""
    user = await get_optional_user(request, session_token)
    habit = Habit(**habit_data.dict())
    if user:
        habit.user_id = user.user_id
    await db.habits.insert_one(habit.dict())
    logger.info(f"Created habit: {habit.name}")
    return habit

@api_router.get("/habits", response_model=List[Habit])
async def get_habits(request: Request, session_token: Optional[str] = Cookie(None)):
    """Récupérer toutes les habitudes actives"""
    user = await get_optional_user(request, session_token)
    query = {"is_active": True}
    if user:
        query["$or"] = [{"user_id": user.user_id}, {"user_id": None}]
    habits = await db.habits.find(query).to_list(100)
    return [Habit(**h) for h in habits]

@api_router.get("/habits/{habit_id}", response_model=Habit)
async def get_habit(habit_id: str):
    """Récupérer une habitude par ID"""
    habit = await db.habits.find_one({"id": habit_id})
    if not habit:
        raise HTTPException(status_code=404, detail="Habitude non trouvée")
    return Habit(**habit)

@api_router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: str):
    """Supprimer une habitude (soft delete)"""
    result = await db.habits.update_one(
        {"id": habit_id},
        {"$set": {"is_active": False}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Habitude non trouvée")
    return {"message": "Habitude supprimée", "success": True}

@api_router.post("/habits/{habit_id}/checkin", response_model=HabitLog)
async def checkin_habit(habit_id: str, checkin: HabitCheckIn, request: Request, session_token: Optional[str] = Cookie(None)):
    """Enregistrer un check-in quotidien pour une habitude"""
    user = await get_optional_user(request, session_token)
    
    habit = await db.habits.find_one({"id": habit_id})
    if not habit:
        raise HTTPException(status_code=404, detail="Habitude non trouvée")
    
    today = date.today().isoformat()
    
    existing_log = await db.habit_logs.find_one({
        "habit_id": habit_id,
        "date": today
    })
    
    if existing_log:
        await db.habit_logs.update_one(
            {"id": existing_log["id"]},
            {"$set": {"done": checkin.done, "logged_at": datetime.utcnow()}}
        )
        log = HabitLog(**{**existing_log, "done": checkin.done})
    else:
        log = HabitLog(habit_id=habit_id, date=today, done=checkin.done)
        if user:
            log.user_id = user.user_id
        await db.habit_logs.insert_one(log.dict())
    
    if checkin.done:
        streak = await calculate_streak(habit_id)
        await db.habits.update_one(
            {"id": habit_id},
            {"$set": {"streak": streak}}
        )
    
    return log

async def calculate_streak(habit_id: str) -> int:
    """Calculer la série actuelle pour une habitude"""
    logs = await db.habit_logs.find(
        {"habit_id": habit_id, "done": True}
    ).sort("date", -1).to_list(100)
    
    if not logs:
        return 0
    
    streak = 0
    today = date.today()
    
    for i, log in enumerate(logs):
        log_date = date.fromisoformat(log["date"])
        expected_date = today - timedelta(days=i)
        
        if log_date == expected_date:
            streak += 1
        else:
            break
    
    return streak

@api_router.get("/habits/{habit_id}/logs", response_model=List[HabitLog])
async def get_habit_logs(habit_id: str, days: int = 7):
    """Récupérer les logs d'une habitude pour les X derniers jours"""
    logs = await db.habit_logs.find(
        {"habit_id": habit_id}
    ).sort("date", -1).to_list(days)
    return [HabitLog(**log) for log in logs]

@api_router.get("/today")
async def get_today_status(request: Request, session_token: Optional[str] = Cookie(None)):
    """Récupérer le statut du jour (habitudes, logs, humeur)"""
    user = await get_optional_user(request, session_token)
    today = date.today().isoformat()
    
    query = {"is_active": True}
    if user:
        query["$or"] = [{"user_id": user.user_id}, {"user_id": None}]
    
    habits = await db.habits.find(query).to_list(100)
    today_logs = await db.habit_logs.find({"date": today}).to_list(100)
    today_mood = await db.moods.find_one({"date": today})
    
    log_map = {log["habit_id"]: log["done"] for log in today_logs}
    
    habits_with_status = []
    for h in habits:
        habit_dict = Habit(**h).dict()
        habit_dict["completed_today"] = log_map.get(h["id"], False)
        habits_with_status.append(habit_dict)
    
    completed = sum(1 for h in habits_with_status if h["completed_today"])
    total = len(habits_with_status)
    
    return {
        "date": today,
        "habits": habits_with_status,
        "progress": {
            "completed": completed,
            "total": total,
            "percentage": round((completed / total * 100) if total > 0 else 0)
        },
        "mood": MoodEntry(**today_mood).dict() if today_mood else None
    }

# ==================== MOOD ENDPOINTS ====================

@api_router.post("/moods", response_model=MoodEntry)
async def create_mood(mood_data: MoodCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Enregistrer l'humeur du jour"""
    user = await get_optional_user(request, session_token)
    
    if not 1 <= mood_data.mood <= 5:
        raise HTTPException(status_code=400, detail="L'humeur doit être entre 1 et 5")
    
    today = date.today().isoformat()
    
    existing = await db.moods.find_one({"date": today})
    
    if existing:
        await db.moods.update_one(
            {"id": existing["id"]},
            {"$set": {"mood": mood_data.mood, "note": mood_data.note}}
        )
        return MoodEntry(**{**existing, "mood": mood_data.mood, "note": mood_data.note})
    
    mood_entry = MoodEntry(date=today, **mood_data.dict())
    if user:
        mood_entry.user_id = user.user_id
    await db.moods.insert_one(mood_entry.dict())
    return mood_entry

@api_router.get("/moods", response_model=List[MoodEntry])
async def get_moods(days: int = 7):
    """Récupérer les humeurs des X derniers jours"""
    moods = await db.moods.find().sort("date", -1).to_list(days)
    return [MoodEntry(**m) for m in moods]

@api_router.get("/moods/today")
async def get_today_mood():
    """Récupérer l'humeur du jour"""
    today = date.today().isoformat()
    mood = await db.moods.find_one({"date": today})
    if mood:
        return MoodEntry(**mood)
    return None

# ==================== AI COACH ENDPOINTS ====================

@api_router.post("/coach/insight")
async def get_coach_insight(request_data: CoachRequest, request: Request, session_token: Optional[str] = Cookie(None)):
    """Obtenir un insight du coach IA basé sur les données du jour"""
    try:
        user = await get_optional_user(request, session_token)
        today = date.today().isoformat()
        
        query = {"is_active": True}
        if user:
            query["$or"] = [{"user_id": user.user_id}, {"user_id": None}]
        
        habits = await db.habits.find(query).to_list(100)
        today_logs = await db.habit_logs.find({"date": today}).to_list(100)
        today_mood = await db.moods.find_one({"date": today})
        
        log_map = {log["habit_id"]: log["done"] for log in today_logs}
        habit_summary = []
        total_streak = 0
        
        for h in habits:
            completed = log_map.get(h["id"], False)
            status = "✅" if completed else "❌"
            habit_summary.append(f"- {h['name']} ({h['category']}): {status}")
            total_streak += h.get("streak", 0)
        
        habit_data = "\n".join(habit_summary) if habit_summary else "Aucune habitude enregistrée"
        mood_value = today_mood["mood"] if today_mood else "Non renseigné"
        avg_streak = round(total_streak / len(habits)) if habits else 0
        
        system_prompt = """Tu es un coach en psychologie des habitudes, bienveillant et direct.
Tu utilises les principes de la thérapie comportementale et cognitive (TCC).
Tu réponds toujours en français avec un ton motivant mais réaliste.
Génère une analyse courte (3 phrases max) avec un conseil concret."""
        
        user_prompt = f"""L'utilisateur s'appelle {request_data.user_name}.
Voici ses habitudes du jour:
{habit_data}

Son humeur aujourd'hui: {mood_value}/5
Sa série moyenne actuelle: {avg_streak} jours

Donne-lui un feedback personnalisé et un conseil concret basé sur les principes TCC."""
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"coach-{today}",
            system_message=system_prompt
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=user_prompt)
        response = await chat.send_message(user_message)
        
        coach_msg = CoachMessage(role="assistant", content=response)
        if user:
            coach_msg.user_id = user.user_id
        await db.coach_messages.insert_one(coach_msg.dict())
        
        logger.info(f"AI Coach insight generated for {request_data.user_name}")
        
        return {
            "insight": response,
            "context": {
                "habits_completed": sum(1 for h in habits if log_map.get(h["id"], False)),
                "habits_total": len(habits),
                "mood": mood_value,
                "average_streak": avg_streak
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating AI insight: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération de l'insight: {str(e)}")

@api_router.get("/coach/messages", response_model=List[CoachMessage])
async def get_coach_messages(limit: int = 50):
    """Récupérer l'historique des messages du coach"""
    messages = await db.coach_messages.find().sort("created_at", -1).to_list(limit)
    return [CoachMessage(**m) for m in reversed(messages)]

@api_router.post("/coach/chat")
async def chat_with_coach(request_data: ChatMessageRequest, request: Request, session_token: Optional[str] = Cookie(None)):
    """Envoyer un message au coach et recevoir une réponse personnalisée"""
    try:
        user = await get_optional_user(request, session_token)
        today = date.today().isoformat()
        
        user_msg = CoachMessage(role="user", content=request_data.message)
        if user:
            user_msg.user_id = user.user_id
        await db.coach_messages.insert_one(user_msg.dict())
        
        query = {"is_active": True}
        if user:
            query["$or"] = [{"user_id": user.user_id}, {"user_id": None}]
        
        habits = await db.habits.find(query).to_list(100)
        today_logs = await db.habit_logs.find({"date": today}).to_list(100)
        today_mood = await db.moods.find_one({"date": today})
        recent_moods = await db.moods.find().sort("date", -1).to_list(7)
        
        log_map = {log["habit_id"]: log["done"] for log in today_logs}
        habit_summary = []
        total_streak = 0
        
        for h in habits:
            completed = log_map.get(h["id"], False)
            status = "✅" if completed else "❌"
            habit_summary.append(f"- {h['name']} ({h['category']}): {status}, série: {h.get('streak', 0)} jours")
            total_streak += h.get("streak", 0)
        
        habit_data = "\n".join(habit_summary) if habit_summary else "Aucune habitude enregistrée"
        mood_value = today_mood["mood"] if today_mood else "Non renseigné"
        avg_mood = round(sum(m["mood"] for m in recent_moods) / len(recent_moods), 1) if recent_moods else "N/A"
        
        recent_messages = await db.coach_messages.find().sort("created_at", -1).to_list(10)
        conversation_context = ""
        if recent_messages:
            for msg in reversed(recent_messages[-6:]):
                role = "Utilisateur" if msg["role"] == "user" else "Coach"
                conversation_context += f"{role}: {msg['content']}\n"
        
        system_prompt = f"""Tu es un coach bienveillant spécialisé en psychologie des habitudes et en thérapie comportementale et cognitive (TCC).
Tu t'appelles Coach et tu parles toujours en français de manière chaleureuse et empathique.

CONTEXTE DE L'UTILISATEUR ({request_data.user_name}):
- Habitudes suivies:
{habit_data}
- Humeur du jour: {mood_value}/5
- Humeur moyenne (7 jours): {avg_mood}/5

TES COMPÉTENCES:
1. Écoute active et empathie - tu valides les émotions avant de conseiller
2. Techniques TCC: restructuration cognitive, exposition progressive, activation comportementale
3. Motivation et renforcement positif
4. Conseils pratiques et réalistes adaptés au contexte

RÈGLES:
- Réponds de manière concise (2-4 phrases max sauf si la situation nécessite plus)
- Utilise des émojis avec parcimonie pour être chaleureux
- Si l'utilisateur ne va pas bien, privilégie l'écoute avant les conseils
- Propose des actions concrètes et réalisables
- Fais référence à ses habitudes quand c'est pertinent"""

        user_prompt = f"""Conversation récente:
{conversation_context}

Nouveau message de l'utilisateur: {request_data.message}

Réponds de manière appropriée en tenant compte du contexte émotionnel et des habitudes de l'utilisateur."""
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"coach-chat-{today}",
            system_message=system_prompt
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=user_prompt)
        response = await chat.send_message(user_message)
        
        assistant_msg = CoachMessage(role="assistant", content=response)
        if user:
            assistant_msg.user_id = user.user_id
        await db.coach_messages.insert_one(assistant_msg.dict())
        
        logger.info(f"Coach chat response generated for {request_data.user_name}")
        
        return {
            "response": response,
            "user_message_id": user_msg.id,
            "assistant_message_id": assistant_msg.id
        }
        
    except Exception as e:
        logger.error(f"Error in coach chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la conversation: {str(e)}")

@api_router.delete("/coach/messages")
async def clear_coach_messages():
    """Effacer l'historique des messages du coach"""
    await db.coach_messages.delete_many({})
    return {"message": "Historique effacé"}

# ==================== PROFILE ENDPOINTS ====================

@api_router.get("/profile")
async def get_profile(request: Request, session_token: Optional[str] = Cookie(None)):
    """Récupérer le profil utilisateur"""
    user = await get_optional_user(request, session_token)
    
    query = {}
    if user:
        query["user_id"] = user.user_id
    
    profile = await db.profile.find_one(query)
    if not profile:
        default_profile = UserProfile()
        if user:
            default_profile.user_id = user.user_id
            default_profile.name = user.name
        await db.profile.insert_one(default_profile.dict())
        return default_profile
    return UserProfile(**profile)

@api_router.put("/profile")
async def update_profile(update: ProfileUpdate, request: Request, session_token: Optional[str] = Cookie(None)):
    """Mettre à jour le profil utilisateur"""
    user = await get_optional_user(request, session_token)
    
    query = {}
    if user:
        query["user_id"] = user.user_id
    
    profile = await db.profile.find_one(query)
    if not profile:
        profile = UserProfile().dict()
        if user:
            profile["user_id"] = user.user_id
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    
    await db.profile.update_one(
        query if query else {},
        {"$set": update_data},
        upsert=True
    )
    
    updated = await db.profile.find_one(query if query else {})
    return UserProfile(**updated)

# ==================== STATS ENDPOINTS ====================

@api_router.get("/stats")
async def get_stats(request: Request, session_token: Optional[str] = Cookie(None)):
    """Récupérer les statistiques globales"""
    user = await get_optional_user(request, session_token)
    
    query = {"is_active": True}
    if user:
        query["$or"] = [{"user_id": user.user_id}, {"user_id": None}]
    
    habits = await db.habits.find(query).to_list(100)
    all_logs = await db.habit_logs.find({"done": True}).to_list(1000)
    moods = await db.moods.find().sort("date", -1).to_list(7)
    
    total_completions = len(all_logs)
    total_streaks = sum(h.get("streak", 0) for h in habits)
    avg_mood = round(sum(m["mood"] for m in moods) / len(moods), 1) if moods else 0
    
    categories = {}
    for h in habits:
        cat = h.get("category", "other")
        if cat not in categories:
            categories[cat] = 0
        categories[cat] += 1
    
    return {
        "total_habits": len(habits),
        "total_completions": total_completions,
        "total_streaks": total_streaks,
        "average_mood_7days": avg_mood,
        "categories": categories
    }

@api_router.get("/stats/charts")
async def get_charts_data(request: Request, session_token: Optional[str] = Cookie(None)):
    """Récupérer les données pour les graphiques"""
    user = await get_optional_user(request, session_token)
    
    query = {"is_active": True}
    if user:
        query["$or"] = [{"user_id": user.user_id}, {"user_id": None}]
    
    habits = await db.habits.find(query).to_list(100)
    
    # Get last 7 days
    today = date.today()
    dates = [(today - timedelta(days=i)).isoformat() for i in range(6, -1, -1)]
    
    # Weekly habit completion data
    weekly_data = []
    for d in dates:
        logs = await db.habit_logs.find({"date": d, "done": True}).to_list(100)
        day_name = datetime.fromisoformat(d).strftime("%a")
        weekly_data.append({
            "date": d,
            "day": day_name,
            "completed": len(logs),
            "total": len(habits)
        })
    
    # Mood evolution (last 14 days)
    mood_dates = [(today - timedelta(days=i)).isoformat() for i in range(13, -1, -1)]
    mood_data = []
    for d in mood_dates:
        mood = await db.moods.find_one({"date": d})
        mood_data.append({
            "date": d,
            "mood": mood["mood"] if mood else None
        })
    
    # Category breakdown
    categories = {}
    category_colors = {
        "sport": "#EF4444",
        "study": "#3B82F6",
        "health": "#10B981",
        "productivity": "#FBBF24"
    }
    for h in habits:
        cat = h.get("category", "other")
        if cat not in categories:
            categories[cat] = {"count": 0, "color": category_colors.get(cat, "#8B5CF6")}
        categories[cat]["count"] += 1
    
    category_data = [
        {"name": k, "count": v["count"], "color": v["color"]}
        for k, v in categories.items()
    ]
    
    # Streak leaders
    streak_data = sorted(
        [{"name": h["name"], "streak": h.get("streak", 0), "category": h["category"]} for h in habits],
        key=lambda x: x["streak"],
        reverse=True
    )[:5]
    
    return {
        "weekly_completion": weekly_data,
        "mood_evolution": mood_data,
        "categories": category_data,
        "streak_leaders": streak_data
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
