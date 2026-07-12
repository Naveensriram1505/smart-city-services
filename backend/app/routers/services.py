from fastapi import APIRouter

router = APIRouter(prefix="/services", tags=["services"])


@router.get("/parking")
def parking():
    return {"message": "Parking service placeholder"}


@router.get("/transport")
def transport():
    return {"message": "Transport service placeholder"}


@router.get("/news")
def news():
    return {"message": "City news placeholder"}


@router.get("/nearby")
def nearby():
    return {"message": "Nearby services placeholder"}


@router.get("/emergency")
def emergency():
    return {"message": "Emergency services placeholder"}
