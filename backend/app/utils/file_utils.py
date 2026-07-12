import os
from pathlib import Path
from fastapi import UploadFile
from app.config.settings import settings

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def save_upload(file: UploadFile) -> str:
    file_name = f"{Path(file.filename).stem}_{os.urandom(4).hex()}{Path(file.filename).suffix}"
    path = UPLOAD_DIR / file_name
    with path.open("wb") as f:
        f.write(file.file.read())
    return str(path)
