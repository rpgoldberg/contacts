from pydantic import BaseModel, ConfigDict


class LookupCodeBase(BaseModel):
    field_name: str
    code: str
    description: str


class LookupCodeCreate(LookupCodeBase):
    pass


class LookupCodeResponse(LookupCodeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
