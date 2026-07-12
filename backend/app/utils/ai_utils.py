from fastapi import UploadFile


def get_chat_reply(message: str) -> str:
    return f"AI reply to: {message}"


def classify_waste(file: UploadFile) -> dict:
    return {"label": "recyclable", "confidence": 0.85}
