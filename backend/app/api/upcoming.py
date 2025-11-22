from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, extract, or_, and_
from pydantic import BaseModel

from app.database import get_db
from app.models import Person
from app.models.user import User
from app.auth import get_current_user, get_accessible_user_ids

router = APIRouter()


class UpcomingEvent(BaseModel):
    person_id: int
    name: str
    event_type: str  # "birthday" or "anniversary"
    date: date
    original_year: int | None
    days_until: int


@router.get("/birthdays", response_model=list[UpcomingEvent])
async def upcoming_birthdays(
    days: int = Query(30, ge=1, le=365, description="Number of days to look ahead"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get upcoming birthdays within the specified number of days."""
    today = date.today()
    accessible_ids = get_accessible_user_ids(current_user)

    # Get all persons with birth dates for accessible users
    query = select(Person).where(
        Person.birth_date.isnot(None),
        Person.owner_id.in_(accessible_ids)
    )
    result = await db.execute(query)
    persons = result.scalars().all()

    upcoming = []
    for person in persons:
        if person.birth_date and person.decease_date is None:
            # Calculate this year's birthday
            try:
                this_year_bday = person.birth_date.replace(year=today.year)
            except ValueError:
                # Handle Feb 29
                this_year_bday = person.birth_date.replace(year=today.year, day=28)

            # If birthday has passed this year, check next year
            if this_year_bday < today:
                try:
                    this_year_bday = person.birth_date.replace(year=today.year + 1)
                except ValueError:
                    this_year_bday = person.birth_date.replace(year=today.year + 1, day=28)

            days_until = (this_year_bday - today).days

            if 0 <= days_until <= days:
                upcoming.append(
                    UpcomingEvent(
                        person_id=person.id,
                        name=person.display_name,
                        event_type="birthday",
                        date=this_year_bday,
                        original_year=person.birth_date.year if person.birth_date.year < 3000 else None,
                        days_until=days_until,
                    )
                )

    return sorted(upcoming, key=lambda x: x.days_until)


@router.get("/anniversaries", response_model=list[UpcomingEvent])
async def upcoming_anniversaries(
    days: int = Query(30, ge=1, le=365, description="Number of days to look ahead"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get upcoming anniversaries within the specified number of days."""
    today = date.today()
    accessible_ids = get_accessible_user_ids(current_user)

    # Get all persons with anniversary dates for accessible users
    query = select(Person).where(
        Person.anniversary_date.isnot(None),
        Person.owner_id.in_(accessible_ids)
    )
    result = await db.execute(query)
    persons = result.scalars().all()

    upcoming = []
    for person in persons:
        if person.anniversary_date and person.decease_date is None:
            # Calculate this year's anniversary
            try:
                this_year_anniv = person.anniversary_date.replace(year=today.year)
            except ValueError:
                this_year_anniv = person.anniversary_date.replace(year=today.year, day=28)

            # If anniversary has passed this year, check next year
            if this_year_anniv < today:
                try:
                    this_year_anniv = person.anniversary_date.replace(year=today.year + 1)
                except ValueError:
                    this_year_anniv = person.anniversary_date.replace(year=today.year + 1, day=28)

            days_until = (this_year_anniv - today).days

            if 0 <= days_until <= days:
                upcoming.append(
                    UpcomingEvent(
                        person_id=person.id,
                        name=person.display_name,
                        event_type="anniversary",
                        date=this_year_anniv,
                        original_year=person.anniversary_date.year,
                        days_until=days_until,
                    )
                )

    return sorted(upcoming, key=lambda x: x.days_until)


@router.get("/all", response_model=list[UpcomingEvent])
async def upcoming_all(
    days: int = Query(30, ge=1, le=365, description="Number of days to look ahead"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all upcoming events (birthdays and anniversaries)."""
    birthdays = await upcoming_birthdays(days=days, db=db, current_user=current_user)
    anniversaries = await upcoming_anniversaries(days=days, db=db, current_user=current_user)

    all_events = birthdays + anniversaries
    return sorted(all_events, key=lambda x: x.days_until)
