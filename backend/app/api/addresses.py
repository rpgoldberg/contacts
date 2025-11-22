from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Address, Person
from app.schemas import AddressCreate, AddressUpdate, AddressResponse

router = APIRouter()


@router.get("/", response_model=list[AddressResponse])
async def list_addresses(
    person_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List addresses, optionally filtered by person."""
    query = select(Address)
    if person_id:
        query = query.where(Address.person_id == person_id)
    query = query.order_by(Address.address_type)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{address_id}", response_model=AddressResponse)
async def get_address(address_id: int, db: AsyncSession = Depends(get_db)):
    """Get an address by ID."""
    query = select(Address).where(Address.id == address_id)
    result = await db.execute(query)
    address = result.scalar_one_or_none()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    return address


@router.post("/", response_model=AddressResponse, status_code=201)
async def create_address(address_in: AddressCreate, db: AsyncSession = Depends(get_db)):
    """Create a new address."""
    # Verify person exists
    person_query = select(Person).where(Person.id == address_in.person_id)
    result = await db.execute(person_query)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Person not found")

    address = Address(**address_in.model_dump())
    db.add(address)
    await db.flush()
    await db.refresh(address)
    return address


@router.put("/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: int, address_in: AddressUpdate, db: AsyncSession = Depends(get_db)
):
    """Update an address."""
    query = select(Address).where(Address.id == address_id)
    result = await db.execute(query)
    address = result.scalar_one_or_none()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    update_data = address_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(address, field, value)

    await db.flush()
    await db.refresh(address)
    return address


@router.delete("/{address_id}", status_code=204)
async def delete_address(address_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an address."""
    query = select(Address).where(Address.id == address_id)
    result = await db.execute(query)
    address = result.scalar_one_or_none()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    await db.delete(address)
