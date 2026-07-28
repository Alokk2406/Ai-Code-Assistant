from sqlalchemy import Column, Integer, String, Text, DateTime, func
from database import Base


class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(50), nullable=False)  # e.g. "generate", "debug", "convert"
    detail = Column(Text, nullable=True)          # short summary of what happened
    created_at = Column(DateTime(timezone=True), server_default=func.now())
