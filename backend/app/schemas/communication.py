from typing import Optional
from pydantic import BaseModel, ConfigDict


class CommunicationBase(BaseModel):
    comm_type: Optional[str] = None
    detail: Optional[str] = None


class CommunicationCreate(CommunicationBase):
    person_id: int


class CommunicationUpdate(CommunicationBase):
    pass


class CommunicationResponse(CommunicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    person_id: int
