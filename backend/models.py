from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DateTime, Boolean
from sqlalchemy.orm import relationship
from .database import Base

class BoxBatch(Base):
    __tablename__ = "box_batches"
    
    id = Column(Integer, primary_key=True, index=True)
    box_id = Column(String, ForeignKey("boxes.id"))
    ship_name = Column(String)
    material_id = Column(String)
    expected_weight_g = Column(Float, nullable=True)
    start_date = Column(DateTime)
    end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    box = relationship("Box", back_populates="batches", foreign_keys=[box_id])
    readings = relationship("BoxReading", back_populates="batch")
    daily_histories = relationship("BoxDailyHistory", back_populates="batch")

class Box(Base):
    __tablename__ = "boxes"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    status = Column(String) # "vazio", "ocupado"
    material_id = Column(String, nullable=True)
    capacity_cm3 = Column(Float)
    volume_cm3 = Column(Float)
    input_weight_g = Column(Float, default=0.0)
    lidar_status = Column(String) # "online", "offline", "erro"
    
    geometry_length_cm = Column(Float, default=47.62)
    geometry_width_cm = Column(Float, default=17.5)
    geometry_height_cm = Column(Float, default=16.0)

    current_batch_id = Column(Integer, ForeignKey("box_batches.id", use_alter=True), nullable=True)
    current_batch = relationship("BoxBatch", foreign_keys=[current_batch_id], post_update=True)

    batches = relationship("BoxBatch", back_populates="box", foreign_keys=[BoxBatch.box_id])
    readings = relationship("BoxReading", back_populates="box", cascade="all, delete-orphan")
    daily_histories = relationship("BoxDailyHistory", back_populates="box", cascade="all, delete-orphan")

class BoxReading(Base):
    __tablename__ = "box_readings"

    id = Column(Integer, primary_key=True, index=True)
    box_id = Column(String, ForeignKey("boxes.id"))
    batch_id = Column(Integer, ForeignKey("box_batches.id"), nullable=True)
    timestamp = Column(DateTime, index=True)
    volume = Column(Float)
    weight = Column(Float)
    material_id = Column(String, nullable=True)
    lidar_status = Column(String)

    box = relationship("Box", back_populates="readings")
    batch = relationship("BoxBatch", back_populates="readings")

class BoxDailyHistory(Base):
    __tablename__ = "box_daily_history"

    id = Column(Integer, primary_key=True, index=True)
    box_id = Column(String, ForeignKey("boxes.id"))
    batch_id = Column(Integer, ForeignKey("box_batches.id"), nullable=True)
    date = Column(Date, index=True)
    initial_volume = Column(Float)
    initial_weight = Column(Float)
    final_volume = Column(Float)
    final_weight = Column(Float)
    material_id = Column(String, nullable=True)
    
    box = relationship("Box", back_populates="daily_histories")
    batch = relationship("BoxBatch", back_populates="daily_histories")


class BoxTruckLoading(Base):
    __tablename__ = "box_truck_loadings"

    id = Column(Integer, primary_key=True, index=True)
    box_id = Column(String, ForeignKey("boxes.id"))
    client_name = Column(String)
    target_grams = Column(Float)
    loaded_grams = Column(Float)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    
    box = relationship("Box")
