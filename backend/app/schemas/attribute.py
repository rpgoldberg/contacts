from typing import Optional
from pydantic import BaseModel, ConfigDict


class AttributeBase(BaseModel):
    attrib_type: Optional[str] = None
    detail: Optional[str] = None


class AttributeCreate(AttributeBase):
    person_id: int


class AttributeUpdate(AttributeBase):
    pass


class AttributeResponse(AttributeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    person_id: int
