from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .database import engine, Base, SessionLocal
from . import models
from .routers import boxes
from datetime import date, time, timedelta, datetime
import random

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="VoluScan API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(boxes.router)

def init_db():
    db = SessionLocal()
    if db.query(models.Box).first() is None:
        # Create 10 empty boxes
        for i in range(1, 11):
            box_id = f"{i:02d}"
            
            # 9 boxes com capacidade ~8.000cm³, 1 box (ex: o Box 10) com ~5.000cm³
            is_small_box = (i == 10)
            
            cap_cm3 = 125000.0
            length = 50.0
            width = 50.0
            height = 50.0
            
            box = models.Box(
                id=box_id,
                name=f"BOX {box_id}",
                status="vazio",
                material_id=None,
                capacity_cm3=cap_cm3,
                volume_cm3=0.0,
                input_weight_g=0.0,
                lidar_status="online",
                geometry_length_cm=length,
                geometry_width_cm=width,
                geometry_height_cm=height
            )
            db.add(box)
        db.commit()
    db.close()

init_db()

@app.get("/")
def read_root():
    return {"message": "Bem vindo a API do VoluScan"}

@app.get("/api/scanner/points")
async def get_scanner_points():
    import httpx
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.get(f"{boxes.SCANNER_BASE_URL}/points")
            if r.status_code == 200:
                return r.json()
        except Exception as e:
            return {"ok": False, "msg": str(e)}
    return {"ok": False, "msg": "Pontos não disponíveis."}

@app.get("/api/scanner")
async def get_scanner_status():
    import httpx
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            r = await client.get(boxes.SCANNER_BASE_URL)
            if r.status_code == 200:
                return r.json()
        except Exception as e:
            return {"ok": False, "msg": str(e)}
    return {"ok": False, "msg": "Scanner offline."}

@app.post("/api/volume/compute")
async def compute_volume_endpoint():
    import httpx
    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            r = await client.post("http://pc-optiplex-3000.tail78ad2d.ts.net:8007/api/volume/compute")
            if r.status_code == 200:
                return r.json()
        except Exception as e:
            return {"ok": False, "msg": str(e)}
    return {"ok": False, "msg": "Erro ao computar volume"}
