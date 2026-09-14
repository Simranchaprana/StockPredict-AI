from sqlalchemy import Column, Integer, String, Float, DateTime
import datetime
from .database import Base

class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    prediction_direction = Column(String)
    confidence = Column(Float)
    predicted_price = Column(Float)
    model = Column(String)
