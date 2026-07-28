from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.chat import Chat
from models.history import History
from services.ai_service import ask_ai

router = APIRouter(tags=["Chat"])


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    system_prompt = (
        "You are an expert programming assistant. Answer clearly, with a short "
        "explanation, a code example when useful, complexity notes, and typical "
        "use cases."
    )
    reply = ask_ai(system_prompt, payload.message, task="chat")

    db.add(Chat(prompt=payload.message, response=reply))
    db.add(History(action="chat", detail=payload.message[:200]))
    db.commit()

    return ChatResponse(response=reply)
