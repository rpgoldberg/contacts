from typing import Optional
from pydantic import BaseModel, ConfigDict


class AddressBase(BaseModel):
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    address_type: Optional[str] = None


class AddressCreate(AddressBase):
    person_id: int


class AddressUpdate(AddressBase):
    pass


class AddressResponse(AddressBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    person_id: int
    full_address: str
