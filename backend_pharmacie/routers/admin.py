from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db

router = APIRouter(prefix="/admin", tags=["Administration"])

@router.post("/upload")
async def upload_fichier_pharmacies(
    fichier: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    # 1. Check if the file is CSV or Excel
    if not fichier.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Format de fichier non supporté. Utilisez CSV ou Excel.")
    
    # 2. We will add the logic to save and parse the file here next
    
    return {"message": f"Fichier {fichier.filename} reçu avec succès. Prêt pour le traitement."}