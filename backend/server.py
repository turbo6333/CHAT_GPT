from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# OpenAI Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

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

# ==================== MODELS ====================

class Habit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # sport, study, health, productivity
    reminder_time: Optional[str] = None  # HH:MM format
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
    date: str  # YYYY-MM-DD
    done: bool
    logged_at: datetime = Field(default_factory=datetime.utcnow)

class HabitCheckIn(BaseModel):
    done: bool

class MoodEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # YYYY-MM-DD
    mood: int  # 1-5
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MoodCreate(BaseModel):
    mood: int
    note: Optional[str] = None

class CoachMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str  # user or assistant
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CoachRequest(BaseModel):
    user_name: Optional[str] = "Utilisateur"

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "Utilisateur"
    notification_time: str = "08:00"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    notification_time: Optional[str] = None

# ==================== HABITS ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "CoachHabits API - Bienvenue!"}

@api_router.post("/habits", response_model=Habit)
async def create_habit(habit_data: HabitCreate):
    """Créer une nouvelle habitude"""
    habit = Habit(**habit_data.dict())
    await db.habits.insert_one(habit.dict())
    logger.info(f"Created habit: {habit.name}")
    return habit

@api_router.get("/habits", response_model=List[Habit])
async def get_habits():
    """Récupérer toutes les habitudes actives"""
    habits = await db.habits.find({"is_active": True}).to_list(100)
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
    return {"message": "Habitude supprimée"}

@api_router.post("/habits/{habit_id}/checkin", response_model=HabitLog)
async def checkin_habit(habit_id: str, checkin: HabitCheckIn):
    """Enregistrer un check-in quotidien pour une habitude"""
    # Check if habit exists
    habit = await db.habits.find_one({"id": habit_id})
    if not habit:
        raise HTTPException(status_code=404, detail="Habitude non trouvée")
    
    today = date.today().isoformat()
    
    # Check if already logged today
    existing_log = await db.habit_logs.find_one({
        "habit_id": habit_id,
        "date": today
    })
    
    if existing_log:
        # Update existing log
        await db.habit_logs.update_one(
            {"id": existing_log["id"]},
            {"$set": {"done": checkin.done, "logged_at": datetime.utcnow()}}
        )
        log = HabitLog(**{**existing_log, "done": checkin.done})
    else:
        # Create new log
        log = HabitLog(habit_id=habit_id, date=today, done=checkin.done)
        await db.habit_logs.insert_one(log.dict())
    
    # Update streak
    if checkin.done:
        # Calculate streak
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
        expected_date = today - __import__('datetime').timedelta(days=i)
        
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
async def get_today_status():
    """Récupérer le statut du jour (habitudes, logs, humeur)"""
    today = date.today().isoformat()
    
    habits = await db.habits.find({"is_active": True}).to_list(100)
    today_logs = await db.habit_logs.find({"date": today}).to_list(100)
    today_mood = await db.moods.find_one({"date": today})
    
    # Map logs to habits
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
async def create_mood(mood_data: MoodCreate):
    """Enregistrer l'humeur du jour"""
    if not 1 <= mood_data.mood <= 5:
        raise HTTPException(status_code=400, detail="L'humeur doit être entre 1 et 5")
    
    today = date.today().isoformat()
    
    # Check if already logged today
    existing = await db.moods.find_one({"date": today})
    
    if existing:
        # Update existing
        await db.moods.update_one(
            {"id": existing["id"]},
            {"$set": {"mood": mood_data.mood, "note": mood_data.note}}
        )
        return MoodEntry(**{**existing, "mood": mood_data.mood, "note": mood_data.note})
    
    mood_entry = MoodEntry(date=today, **mood_data.dict())
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
async def get_coach_insight(request: CoachRequest):
    """Obtenir un insight du coach IA basé sur les données du jour"""
    try:
        today = date.today().isoformat()
        
        # Get today's data
        habits = await db.habits.find({"is_active": True}).to_list(100)
        today_logs = await db.habit_logs.find({"date": today}).to_list(100)
        today_mood = await db.moods.find_one({"date": today})
        
        # Build habit summary
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
        
        # Build the AI prompt
        system_prompt = """Tu es un coach en psychologie des habitudes, bienveillant et direct.
Tu utilises les principes de la thérapie comportementale et cognitive (TCC).
Tu réponds toujours en français avec un ton motivant mais réaliste.
Génère une analyse courte (3 phrases max) avec un conseil concret."""
        
        user_prompt = f"""L'utilisateur s'appelle {request.user_name}.
Voici ses habitudes du jour:
{habit_data}

Son humeur aujourd'hui: {mood_value}/5
Sa série moyenne actuelle: {avg_streak} jours

Donne-lui un feedback personnalisé et un conseil concret basé sur les principes TCC."""
        
        # Call OpenAI via emergentintegrations
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"coach-{today}",
            system_message=system_prompt
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=user_prompt)
        response = await chat.send_message(user_message)
        
        # Save the message
        coach_msg = CoachMessage(role="assistant", content=response)
        await db.coach_messages.insert_one(coach_msg.dict())
        
        logger.info(f"AI Coach insight generated for {request.user_name}")
        
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
async def get_coach_messages(limit: int = 20):
    """Récupérer l'historique des messages du coach"""
    messages = await db.coach_messages.find().sort("created_at", -1).to_list(limit)
    return [CoachMessage(**m) for m in reversed(messages)]

# ==================== PROFILE ENDPOINTS ====================

@api_router.get("/profile")
async def get_profile():
    """Récupérer le profil utilisateur"""
    profile = await db.profile.find_one({})
    if not profile:
        # Create default profile
        default_profile = UserProfile()
        await db.profile.insert_one(default_profile.dict())
        return default_profile
    return UserProfile(**profile)

@api_router.put("/profile")
async def update_profile(update: ProfileUpdate):
    """Mettre à jour le profil utilisateur"""
    profile = await db.profile.find_one({})
    if not profile:
        profile = UserProfile().dict()
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    
    await db.profile.update_one(
        {},
        {"$set": update_data},
        upsert=True
    )
    
    updated = await db.profile.find_one({})
    return UserProfile(**updated)

# ==================== STATS ENDPOINTS ====================

@api_router.get("/stats")
async def get_stats():
    """Récupérer les statistiques globales"""
    habits = await db.habits.find({"is_active": True}).to_list(100)
    all_logs = await db.habit_logs.find({"done": True}).to_list(1000)
    moods = await db.moods.find().sort("date", -1).to_list(7)
    
    total_completions = len(all_logs)
    total_streaks = sum(h.get("streak", 0) for h in habits)
    avg_mood = round(sum(m["mood"] for m in moods) / len(moods), 1) if moods else 0
    
    # Category breakdown
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
