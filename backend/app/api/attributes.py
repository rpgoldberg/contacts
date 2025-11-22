from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Attribute, Person
from app.schemas import AttributeCreate, AttributeUpdate, AttributeResponse

router = APIRouter()


@router.get("/", response_model=list[AttributeResponse])
async def list_attributes(
    person_id: int | None = None,
    attrib_type: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List attributes, optionally filtered by person or type."""
    query = select(Attribute)
    if person_id:
        query = query.where(Attribute.person_id == person_id)
    if attrib_type:
        query = query.where(Attribute.attrib_type == attrib_type)
    query = query.order_by(Attribute.attrib_type)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{attrib_id}", response_model=AttributeResponse)
async def get_attribute(attrib_id: int, db: AsyncSession = Depends(get_db)):
    """Get an attribute by ID."""
    query = select(Attribute).where(Attribute.id == attrib_id)
    result = await db.execute(query)
    attrib = result.scalar_one_or_none()

    if not attrib:
        raise HTTPException(status_code=404, detail="Attribute not found")

    return attrib


@router.post("/", response_model=AttributeResponse, status_code=201)
async def create_attribute(attrib_in: AttributeCreate, db: AsyncSession = Depends(get_db)):
    """Create a new attribute."""
    # Verify person exists
    person_query = select(Person).where(Person.id == attrib_in.person_id)
    result = await db.execute(person_query)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Person not found")

    attrib = Attribute(**attrib_in.model_dump())
    db.add(attrib)
    await db.flush()
    await db.refresh(attrib)
    return attrib


@router.put("/{attrib_id}", response_model=AttributeResponse)
async def update_attribute(
    attrib_id: int, attrib_in: AttributeUpdate, db: AsyncSession = Depends(get_db)
):
    """Update an attribute."""
    query = select(Attribute).where(Attribute.id == attrib_id)
    result = await db.execute(query)
    attrib = result.scalar_one_or_none()

    if not attrib:
        raise HTTPException(status_code=404, detail="Attribute not found")

    update_data = attrib_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(attrib, field, value)

    await db.flush()
    await db.refresh(attrib)
    return attrib


@router.delete("/{attrib_id}", status_code=204)
async def delete_attribute(attrib_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an attribute."""
    query = select(Attribute).where(Attribute.id == attrib_id)
    result = await db.execute(query)
    attrib = result.scalar_one_or_none()

    if not attrib:
        raise HTTPException(status_code=404, detail="Attribute not found")

    await db.delete(attrib)
