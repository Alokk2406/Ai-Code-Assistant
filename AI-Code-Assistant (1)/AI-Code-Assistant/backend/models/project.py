from sqlalchemy import Column, Integer, String, Text, DateTime, func
from database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    language = Column(String(50), nullable=False)
    code = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
