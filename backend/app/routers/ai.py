from fastapi import APIRouter, File, UploadFile
from app.utils.ai_utils import classify_waste, get_chat_reply

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/chat")
def chat(message: str):
    return {"reply": get_chat_reply(message)}


@router.post("/waste-classify")
def waste_classify(file: UploadFile = File(...)):
    result = classify_waste(file)
    return result
