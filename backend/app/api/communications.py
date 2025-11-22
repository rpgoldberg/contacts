from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Communication, Person
from app.schemas import CommunicationCreate, CommunicationUpdate, CommunicationResponse

router = APIRouter()


@router.get("/", response_model=list[CommunicationResponse])
async def list_communications(
    person_id: int | None = None,
    comm_type: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List communications, optionally filtered by person or type."""
    query = select(Communication)
    if person_id:
        query = query.where(Communication.person_id == person_id)
    if comm_type:
        query = query.where(Communication.comm_type == comm_type)
    query = query.order_by(Communication.comm_type)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{comm_id}", response_model=CommunicationResponse)
async def get_communication(comm_id: int, db: AsyncSession = Depends(get_db)):
    """Get a communication by ID."""
    query = select(Communication).where(Communication.id == comm_id)
    result = await db.execute(query)
    comm = result.scalar_one_or_none()

    if not comm:
        raise HTTPException(status_code=404, detail="Communication not found")

    return comm


@router.post("/", response_model=CommunicationResponse, status_code=201)
async def create_communication(
    comm_in: CommunicationCreate, db: AsyncSession = Depends(get_db)
):
    """Create a new communication."""
    # Verify person exists
    person_query = select(Person).where(Person.id == comm_in.person_id)
    result = await db.execute(person_query)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Person not found")

    comm = Communication(**comm_in.model_dump())
    db.add(comm)
    await db.flush()
    await db.refresh(comm)
    return comm


@router.put("/{comm_id}", response_model=CommunicationResponse)
async def update_communication(
    comm_id: int, comm_in: CommunicationUpdate, db: AsyncSession = Depends(get_db)
):
    """Update a communication."""
    query = select(Communication).where(Communication.id == comm_id)
    result = await db.execute(query)
    comm = result.scalar_one_or_none()

    if not comm:
        raise HTTPException(status_code=404, detail="Communication not found")

    update_data = comm_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(comm, field, value)

    await db.flush()
    await db.refresh(comm)
    return comm


@router.delete("/{comm_id}", status_code=204)
async def delete_communication(comm_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a communication."""
    query = select(Communication).where(Communication.id == comm_id)
    result = await db.execute(query)
    comm = result.scalar_one_or_none()

    if not comm:
        raise HTTPException(status_code=404, detail="Communication not found")

    await db.delete(comm)
