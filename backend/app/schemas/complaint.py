from pydantic import BaseModel


class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: str
    priority: str = "medium"
    latitude: float | None = None
    longitude: float | None = None


class ComplaintOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    status: str
    latitude: float | None = None
    longitude: float | None = None
    image_url: str | None = None
    user_id: int

    class Config:
        from_attributes = True
