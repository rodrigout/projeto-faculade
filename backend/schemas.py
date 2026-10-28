from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

class BoxBatchBase(BaseModel):
    ship_name: str
    material_id: str
    expected_weight_g: Optional[float] = None
    expected_volume: Optional[float] = None

class BoxBatchCreate(BoxBatchBase):
    pass

class AddWeight(BaseModel):
    added_weight: float

class BoxBatch(BoxBatchBase):
    id: int
    box_id: str
    start_date: datetime
    end_date: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True

class BoxReadingBase(BaseModel):
    timestamp: datetime
    volume: float
    weight: float
    material_id: Optional[str] = None
    lidar_status: str
    batch_id: Optional[int] = None

class BoxReading(BoxReadingBase):
    id: int
    box_id: str

    class Config:
        from_attributes = True

class BoxDailyHistoryBase(BaseModel):
    date: date
    initial_volume: float
    initial_weight: float
    final_volume: float
    final_weight: float
    material_id: Optional[str] = None
    batch_id: Optional[int] = None

class BoxDailyHistory(BoxDailyHistoryBase):
    id: int
    box_id: str

    class Config:
        from_attributes = True

class BoxBase(BaseModel):
    name: str
    status: str
    material_id: Optional[str] = None
    capacity_cm3: float
    volume_cm3: float
    input_weight_g: float = 0.0
    lidar_status: str
    geometry_length_cm: float
    geometry_width_cm: float
    geometry_height_cm: float
    current_batch_id: Optional[int] = None

class Box(BoxBase):
    id: str
    current_batch: Optional[BoxBatch] = None

    class Config:
        from_attributes = True

class BoxTruckLoadingBase(BaseModel):
    client_name: str
    target_tons: float
    loaded_tons: float
    start_time: datetime
    end_time: datetime

class BoxTruckLoadingCreate(BoxTruckLoadingBase):
    pass

class BoxTruckLoading(BoxTruckLoadingBase):
    id: int
    box_id: str

    class Config:
        from_attributes = True
