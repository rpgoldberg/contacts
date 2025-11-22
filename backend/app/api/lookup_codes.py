from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import LookupCode
from app.schemas import LookupCodeResponse

router = APIRouter()


@router.get("/", response_model=list[LookupCodeResponse])
async def list_lookup_codes(
    field_name: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List lookup codes, optionally filtered by field name."""
    query = select(LookupCode)
    if field_name:
        query = query.where(LookupCode.field_name == field_name)
    query = query.order_by(LookupCode.field_name, LookupCode.code)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/fields", response_model=list[str])
async def list_field_names(db: AsyncSession = Depends(get_db)):
    """List distinct field names."""
    query = select(LookupCode.field_name).distinct().order_by(LookupCode.field_name)
    result = await db.execute(query)
    return [row[0] for row in result.all()]
