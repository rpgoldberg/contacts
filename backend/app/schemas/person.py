from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.address import AddressResponse
from app.schemas.communication import CommunicationResponse
from app.schemas.attribute import AttributeResponse


class PersonBase(BaseModel):
    first_name: Optional[str] = None
    middle_initial: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[date] = None
    anniversary_date: Optional[date] = None
    relation: Optional[str] = None
    title: Optional[str] = None
    married_to: Optional[str] = None
    decease_date: Optional[date] = None


class PersonCreate(PersonBase):
    pass


class PersonUpdate(PersonBase):
    pass


class PersonResponse(PersonBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    display_name: str


class PersonListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: str
    birth_date: Optional[date] = None
    anniversary_date: Optional[date] = None
    relation: Optional[str] = None


class PersonDetailResponse(PersonResponse):
    addresses: list[AddressResponse] = []
    communications: list[CommunicationResponse] = []
    attributes: list[AttributeResponse] = []
