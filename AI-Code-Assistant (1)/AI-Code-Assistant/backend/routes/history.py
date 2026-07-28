from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from database import get_db
from models.history import History

router = APIRouter(tags=["History"])


class HistoryItem(BaseModel):
    id: int
    action: str
    detail: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/history", response_model=List[HistoryItem])
def list_history(db: Session = Depends(get_db)):
    return db.query(History).order_by(History.created_at.desc()).limit(100).all()


@router.delete("/history")
def clear_history(db: Session = Depends(get_db)):
    deleted = db.query(History).delete()
    db.commit()
    return {"deleted": deleted}
