from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Person, User
from app.schemas import (
    PersonCreate,
    PersonUpdate,
    PersonResponse,
    PersonListResponse,
    PersonDetailResponse,
)
from app.auth import get_current_user, get_accessible_user_ids

router = APIRouter()


@router.get("/", response_model=list[PersonListResponse])
async def list_persons(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = Query(None, description="Search by name"),
    relation: Optional[str] = Query(None, description="Filter by relation type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """List all persons with optional filtering."""
    accessible_ids = get_accessible_user_ids(current_user)

    query = select(Person).where(Person.owner_id.in_(accessible_ids))

    if search:
        search_term = f"%{search}%"
        query = query.where(
            (Person.first_name.ilike(search_term))
            | (Person.last_name.ilike(search_term))
        )

    if relation:
        query = query.where(Person.relation == relation)

    query = query.order_by(Person.last_name, Person.first_name).offset(skip).limit(limit)

    result = await db.execute(query)
    persons = result.scalars().all()
    return persons


@router.get("/{person_id}", response_model=PersonDetailResponse)
async def get_person(
    person_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a person by ID with all related data."""
    accessible_ids = get_accessible_user_ids(current_user)

    query = (
        select(Person)
        .where(Person.id == person_id, Person.owner_id.in_(accessible_ids))
        .options(
            selectinload(Person.addresses),
            selectinload(Person.communications),
            selectinload(Person.attributes),
        )
    )
    result = await db.execute(query)
    person = result.scalar_one_or_none()

    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    return person


@router.post("/", response_model=PersonResponse, status_code=201)
async def create_person(
    person_in: PersonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new person."""
    person = Person(**person_in.model_dump(), owner_id=current_user.id)
    db.add(person)
    await db.flush()
    await db.refresh(person)
    return person


@router.put("/{person_id}", response_model=PersonResponse)
async def update_person(
    person_id: int,
    person_in: PersonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a person."""
    accessible_ids = get_accessible_user_ids(current_user)

    query = select(Person).where(Person.id == person_id, Person.owner_id.in_(accessible_ids))
    result = await db.execute(query)
    person = result.scalar_one_or_none()

    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    update_data = person_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(person, field, value)

    await db.flush()
    await db.refresh(person)
    return person


@router.delete("/{person_id}", status_code=204)
async def delete_person(
    person_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a person and all related data."""
    accessible_ids = get_accessible_user_ids(current_user)

    query = select(Person).where(Person.id == person_id, Person.owner_id.in_(accessible_ids))
    result = await db.execute(query)
    person = result.scalar_one_or_none()

    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    await db.delete(person)
