from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta

import os
from .. import models, schemas
from ..database import get_db

SCANNER_BASE_URL = os.getenv("SCANNER_BASE_URL", "http://pc-optiplex-3000.tail78ad2d.ts.net:8007/api/scanner")

router = APIRouter(
    prefix="/api/boxes",
    tags=["boxes"]
)

@router.get("/", response_model=List[schemas.Box])
def read_boxes(db: Session = Depends(get_db)):
    boxes = db.query(models.Box).all()
    return boxes

@router.get("/{box_id}", response_model=schemas.Box)
async def read_box(box_id: str, db: Session = Depends(get_db)):
    box = db.query(models.Box).filter(models.Box.id == box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
        
    # Sincroniza com o scanner físico se estiver varrendo ou se tiver lote ativo
    if box.lidar_status == "scanning" or box.current_batch_id or box_id in ["01", "02"]:
        import httpx
        async with httpx.AsyncClient(timeout=3.0) as client:
            try:
                r = await client.get(SCANNER_BASE_URL)
                if r.status_code == 200:
                    data = r.json()
                    status_raw = data.get("status", "online").lower()
                    is_hardware_scanning = status_raw in ["scanning", "varrendo"]
                    
                    changed = False
                    if box.lidar_status == "scanning" and not is_hardware_scanning:
                        # Varredura acabou de ser concluída pelo hardware!
                        box.lidar_status = "online"
                        changed = True
                        
                        # Dispara automaticamente o POST em /api/volume/compute para atualizar cubagem e pontos
                        try:
                            comp_res = await client.post("http://pc-optiplex-3000.tail78ad2d.ts.net:8007/api/volume/compute")
                            if comp_res.status_code == 200:
                                comp_data = comp_res.json()
                                if "volume_cm3" in comp_data and float(comp_data["volume_cm3"]) > 0:
                                    box.volume_cm3 = max(0.0, float(comp_data["volume_cm3"]))
                        except Exception as ce:
                            print(f"Erro ao chamar /api/volume/compute: {ce}")

                        last_scan = data.get("last_scan", {})
                        if box.volume_cm3 == 0.0:
                            if "volume_cm3" in last_scan:
                                box.volume_cm3 = max(0.0, float(last_scan["volume_cm3"]))
                            elif "volume_liters" in last_scan:
                                box.volume_cm3 = max(0.0, float(last_scan["volume_liters"]) * 1000.0)
                            
                        # Registra no histórico se houver lote ativo
                        if box.current_batch_id:
                            density = 1.0
                            weight_kg = (box.volume_cm3 / 1000.0) * density
                            if "bench_mass_kg" in last_scan and float(last_scan["bench_mass_kg"]) > 0:
                                weight_kg = float(last_scan["bench_mass_kg"])
                                reading = models.BoxReading(
                                    box_id=box.id,
                                    batch_id=box.current_batch_id,
                                    timestamp=datetime.now(),
                                    volume=box.volume_cm3,
                                    weight=round(weight_kg, 3),
                                    material_id=box.material_id,
                                    lidar_status="online"
                                )
                                db.add(reading)
                    elif is_hardware_scanning and box.lidar_status != "scanning":
                        box.lidar_status = "scanning"
                        changed = True
                    elif not is_hardware_scanning and box.lidar_status not in ["online", "vazio"]:
                        box.lidar_status = "online"
                        changed = True
                    
                    if changed:
                        db.commit()
            except Exception:
                pass
                
    return box

@router.get("/{box_id}/points")
async def get_box_points(box_id: str):
    import httpx
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.get(f"{SCANNER_BASE_URL}/points")
            if r.status_code == 200:
                return r.json()
        except Exception as e:
            return {"ok": False, "msg": str(e)}
    return {"ok": False, "msg": "Pontos não disponíveis para este box."}

@router.post("/{box_id}/volume/compute")
async def compute_box_volume(box_id: str, db: Session = Depends(get_db)):
    box = db.query(models.Box).filter(models.Box.id == box_id).first()
    import httpx
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.post("http://pc-optiplex-3000.tail78ad2d.ts.net:8007/api/volume/compute")
            if r.status_code == 200:
                data = r.json()
                if box and "volume_cm3" in data and float(data["volume_cm3"]) > 0:
                    box.volume_cm3 = max(0.0, float(data["volume_cm3"]))
                    db.commit()
                return data
        except Exception as e:
            return {"ok": False, "msg": str(e)}
    return {"ok": False, "msg": "Erro ao computar volume"}

@router.get("/{box_id}/batches", response_model=List[schemas.BoxBatch])
def read_box_batches(box_id: str, db: Session = Depends(get_db)):
    batches = db.query(models.BoxBatch).filter(models.BoxBatch.box_id == box_id).order_by(models.BoxBatch.start_date.desc()).all()
    return batches

@router.post("/{box_id}/batches", response_model=schemas.BoxBatch)
def create_box_batch(box_id: str, batch_in: schemas.BoxBatchCreate, db: Session = Depends(get_db)):
    box = db.query(models.Box).filter(models.Box.id == box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
    
    active_batch = db.query(models.BoxBatch).filter(models.BoxBatch.box_id == box_id, models.BoxBatch.is_active == True).first()
    if active_batch:
        raise HTTPException(status_code=400, detail="Existe um lote ativo neste box. É necessário finalizá-mo antes de iniciar um novo.")
    
    new_batch = models.BoxBatch(
        box_id=box_id,
        ship_name=batch_in.ship_name,
        material_id=batch_in.material_id,
        expected_weight_g=batch_in.expected_weight_g,
        start_date=datetime.now(),
        is_active=True
    )
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)
    
    # Define o peso de entrada da balança para este box
    if batch_in.expected_weight_g is not None:
        box.input_weight_g = batch_in.expected_weight_g
        box.status = "ocupado"
    
    box.current_batch_id = new_batch.id
    box.material_id = new_batch.material_id
    db.commit()
    
    return new_batch

class UpdateVolume(schemas.BaseModel):
    volume: float

@router.put("/{box_id}/volume", response_model=schemas.Box)
def update_box_volume(box_id: str, data: UpdateVolume, db: Session = Depends(get_db)):
    box = db.query(models.Box).filter(models.Box.id == box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
    box.volume_cm3 = max(0.0, data.volume)
    db.commit()
    return box

import httpx

class ScanSimulate(schemas.BaseModel):
    volume: float
    weight: float
    density: float = 1.0

@router.post("/{box_id}/scan")
async def simulate_scan(box_id: str, scan: ScanSimulate, db: Session = Depends(get_db)):
    box = db.query(models.Box).filter(models.Box.id == box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
    
    # Se o box já está varrendo no hardware, NÃO interrompe o giro de 360 graus!
    if box.lidar_status == "scanning":
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                r = await client.get(SCANNER_BASE_URL)
                if r.status_code == 200:
                    status_raw = r.json().get("status", "").lower()
                    if status_raw in ["scanning", "varrendo"]:
                        return {
                            "status": "scanning",
                            "message": "Varredura 360° já em andamento. Aguardando conclusão da rotação.",
                            "real_volume": box.volume_cm3
                        }
                    else:
                        box.lidar_status = "online"
                        db.commit()
        except Exception:
            return {
                "status": "scanning",
                "message": "Varredura 360° já em andamento.",
                "real_volume": box.volume_cm3
            }

    new_volume = scan.volume
    new_weight = scan.weight
    lidar_status = "online"

    # Dispara a varredura no ambiente físico
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{SCANNER_BASE_URL}/scan")
            if resp.status_code == 200:
                lidar_status = "scanning"
                box.lidar_status = "scanning"
                db.commit()
    except Exception as e:
        print(f"Erro ao disparar varredura no LiDAR físico: {e}")
        lidar_status = "erro"
        box.lidar_status = "erro"
        db.commit()
    
    # O scan "oficializa" o volume e salva a leitura APENAS se houver lote
    reading_id = None
    if box.current_batch_id:
        box.volume_cm3 = max(0.0, new_volume)
        reading = models.BoxReading(
            box_id=box_id,
            batch_id=box.current_batch_id,
            timestamp=datetime.now(),
            volume=box.volume_cm3,
            weight=new_weight,
            material_id=box.material_id,
            lidar_status=lidar_status
        )
        db.add(reading)
        db.commit()
        reading_id = reading.id

    return {"status": "success", "reading_id": reading_id, "real_volume": new_volume}

@router.post("/{box_id}/add-balanca-weight")
def add_balanca_weight(box_id: str, data: schemas.AddWeight, db: Session = Depends(get_db)):
    box = db.query(models.Box).filter(models.Box.id == box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
        
    if box.current_batch_id:
        active_batch = db.query(models.BoxBatch).filter(models.BoxBatch.id == box.current_batch_id).first()
        if active_batch:
            if active_batch.expected_weight_g is None:
                active_batch.expected_weight_g = 0.0
            active_batch.expected_weight_g += data.added_weight
            if box.input_weight_g is None:
                box.input_weight_g = 0.0
            box.input_weight_g += data.added_weight
            db.commit()
    return {"status": "success"}

@router.post("/{box_id}/batches/current/finish", response_model=schemas.BoxBatch)
def finish_current_batch(box_id: str, db: Session = Depends(get_db)):
    box = db.query(models.Box).filter(models.Box.id == box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
        
    active_batch = db.query(models.BoxBatch).filter(models.BoxBatch.box_id == box_id, models.BoxBatch.is_active == True).first()
    if not active_batch:
        raise HTTPException(status_code=400, detail="Não há lote ativo neste box para finalizar.")
        
    # Check volume constraint (< 1%)
    if box.capacity_cm3 > 0:
        percent_full = (box.volume_cm3 / box.capacity_cm3) * 100
        if percent_full >= 1.0:
            raise HTTPException(status_code=400, detail=f"O lote não pode ser finalizado. O volume atual do box ({percent_full:.2f}%) é maior ou igual a 1%. É necessário esvaziar mais o box.")
            
    active_batch.is_active = False
    active_batch.end_date = datetime.now()
    
    box.current_batch_id = None
    box.material_id = None
    box.input_weight_g = 0.0
    
    db.commit()
    db.refresh(active_batch)
    return active_batch

@router.get("/{box_id}/readings", response_model=List[schemas.BoxReading])
def read_box_readings(
    box_id: str, 
    batch_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.BoxReading).filter(models.BoxReading.box_id == box_id)
    
    if batch_id is not None:
        query = query.filter(models.BoxReading.batch_id == batch_id)
    else:
        if start_date:
            query = query.filter(models.BoxReading.timestamp >= start_date)
        if end_date:
            query = query.filter(models.BoxReading.timestamp <= end_date)
        if not start_date and not end_date:
            start_time = datetime.now() - timedelta(days=3)
            query = query.filter(models.BoxReading.timestamp >= start_time)
            
    return query.order_by(models.BoxReading.timestamp).all()

@router.get("/{box_id}/daily-history", response_model=List[schemas.BoxDailyHistory])
def read_box_daily_history(
    box_id: str, 
    batch_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.BoxDailyHistory).filter(models.BoxDailyHistory.box_id == box_id)
    
    if batch_id is not None:
        query = query.filter(models.BoxDailyHistory.batch_id == batch_id)
    else:
        if start_date:
            query = query.filter(models.BoxDailyHistory.date >= start_date)
        if end_date:
            query = query.filter(models.BoxDailyHistory.date <= end_date)
        if not start_date and not end_date:
            default_start = date.today() - timedelta(days=30)
            query = query.filter(models.BoxDailyHistory.date >= default_start)
            
    records = query.order_by(models.BoxDailyHistory.date).all()
    return records

@router.post("/{box_id}/truck-loadings", response_model=schemas.BoxTruckLoading)
def create_truck_loading(box_id: str, loading_in: schemas.BoxTruckLoadingCreate, db: Session = Depends(get_db)):
    box = db.query(models.Box).filter(models.Box.id == box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
        
    new_loading = models.BoxTruckLoading(
        box_id=box_id,
        client_name=loading_in.client_name,
        target_tons=loading_in.target_tons,
        loaded_tons=loading_in.loaded_tons,
        start_time=loading_in.start_time,
        end_time=loading_in.end_time
    )
    db.add(new_loading)
    db.commit()
    db.refresh(new_loading)
    return new_loading

@router.get("/{box_id}/truck-loadings", response_model=List[schemas.BoxTruckLoading])
def get_truck_loadings(box_id: str, db: Session = Depends(get_db)):
    return db.query(models.BoxTruckLoading).filter(models.BoxTruckLoading.box_id == box_id).order_by(models.BoxTruckLoading.start_time.desc()).all()
