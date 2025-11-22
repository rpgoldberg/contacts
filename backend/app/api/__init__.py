from fastapi import APIRouter
from app.api import persons, addresses, communications, attributes, lookup_codes, upcoming, auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(persons.router, prefix="/persons", tags=["persons"])
api_router.include_router(addresses.router, prefix="/addresses", tags=["addresses"])
api_router.include_router(communications.router, prefix="/communications", tags=["communications"])
api_router.include_router(attributes.router, prefix="/attributes", tags=["attributes"])
api_router.include_router(lookup_codes.router, prefix="/lookup-codes", tags=["lookup-codes"])
api_router.include_router(upcoming.router, prefix="/upcoming", tags=["upcoming"])
