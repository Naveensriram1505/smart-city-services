from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.middleware.auth import get_current_user
from app.models.complaint import Complaint
from app.models.user import User
from app.schemas.complaint import ComplaintCreate, ComplaintOut
from app.utils.file_utils import save_upload

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.post("/", response_model=ComplaintOut)
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    complaint = Complaint(**payload.model_dump(), user_id=current_user.id)
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.post("/upload-image")
def upload_complaint_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    path = save_upload(file)
    return {"file_path": path}


@router.get("/", response_model=list[ComplaintOut])
def get_complaints(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    complaints = db.query(Complaint).filter(Complaint.user_id == current_user.id).all()
    return complaints


@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id, Complaint.user_id == current_user.id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint
