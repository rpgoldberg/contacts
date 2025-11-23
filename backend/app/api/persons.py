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
    PersonListPaginatedResponse,
    PersonDetailResponse,
)
from sqlalchemy import func
from app.auth import get_current_user, get_accessible_user_ids

router = APIRouter()


@router.get("/", response_model=PersonListPaginatedResponse)
async def list_persons(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = Query(None, description="Search by name"),
    relation: Optional[str] = Query(None, description="Filter by relation type"),
    dr_filter: bool = Query(False, description="Filter names starting with Dr."),
    sort_by: str = Query("last", description="Sort by 'first' or 'last' name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """List all persons with optional filtering."""
    from sqlalchemy import or_

    accessible_ids = get_accessible_user_ids(current_user)

    # Base filter conditions
    base_conditions = [Person.owner_id.in_(accessible_ids)]

    if search:
        search_term = f"%{search}%"
        base_conditions.append(
            (Person.first_name.ilike(search_term)) | (Person.last_name.ilike(search_term))
        )

    if relation:
        base_conditions.append(Person.relation == relation)

    if dr_filter:
        base_conditions.append(
            or_(
                func.lower(Person.first_name).like("dr.%"),
                func.lower(Person.first_name).like("dr %"),
                func.lower(Person.last_name).like("dr.%"),
                func.lower(Person.last_name).like("dr %"),
            )
        )

    # Get total count (before pagination)
    count_query = select(func.count(Person.id)).where(*base_conditions)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Build main query with pagination
    query = select(Person).where(*base_conditions)

    # Apply sorting
    if sort_by == "first":
        query = query.order_by(Person.first_name, Person.last_name)
    else:
        query = query.order_by(Person.last_name, Person.first_name)

    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    persons = result.scalars().all()

    return PersonListPaginatedResponse(items=persons, total=total)


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
