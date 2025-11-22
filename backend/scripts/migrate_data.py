#!/usr/bin/env python3
"""
Migration script to import data from Access DB CSV exports to PostgreSQL.
"""

import asyncio
import csv
import os
from datetime import datetime
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

# Add parent to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import Base
from app.models import Person, Address, Communication, Attribute, LookupCode

# Default data path
DEFAULT_DATA_PATH = "/tmp/DatabaseExport/Data"


def parse_date(date_str: str) -> datetime | None:
    """Parse date string from Access export."""
    if not date_str or date_str.strip() == "":
        return None
    try:
        # Format: 7/15/1968 0:00:00
        dt = datetime.strptime(date_str.strip(), "%m/%d/%Y %H:%M:%S")
        return dt.date()
    except ValueError:
        try:
            # Try without time
            dt = datetime.strptime(date_str.strip(), "%m/%d/%Y")
            return dt.date()
        except ValueError:
            print(f"Warning: Could not parse date '{date_str}'")
            return None


def clean_string(s: str | None) -> str | None:
    """Clean and normalize string values."""
    if s is None:
        return None
    s = s.strip()
    return s if s else None


async def migrate_lookup_codes(session: AsyncSession, data_path: Path):
    """Import lookup codes from CSV."""
    csv_path = data_path / "tlkpCodes.csv"
    print(f"Importing lookup codes from {csv_path}...")

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            code = LookupCode(
                field_name=clean_string(row["Field Name"]),
                code=clean_string(row["Code"]),
                description=clean_string(row["Description"]),
            )
            session.add(code)
            count += 1

    await session.flush()
    print(f"  Imported {count} lookup codes")


async def migrate_persons(session: AsyncSession, data_path: Path) -> dict[int, int]:
    """Import persons from CSV. Returns mapping of old ID to new ID."""
    csv_path = data_path / "tblPerson.csv"
    print(f"Importing persons from {csv_path}...")

    id_mapping = {}

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            old_id = int(row["Person ID"])
            person = Person(
                first_name=clean_string(row["First Name"]),
                middle_initial=clean_string(row["Middle Initial"]),
                last_name=clean_string(row["Last Name"]),
                birth_date=parse_date(row["Birth Date"]),
                anniversary_date=parse_date(row["Anniversary Date"]),
                relation=clean_string(row["Relation"]),
                title=clean_string(row["Title"]),
                married_to=clean_string(row["Married To"]),
                decease_date=parse_date(row["Decease Date"]),
            )
            session.add(person)
            await session.flush()
            id_mapping[old_id] = person.id
            count += 1

    print(f"  Imported {count} persons")
    return id_mapping


async def migrate_addresses(session: AsyncSession, data_path: Path, id_mapping: dict[int, int]):
    """Import addresses from CSV."""
    csv_path = data_path / "tblAddress.csv"
    print(f"Importing addresses from {csv_path}...")

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        count = 0
        skipped = 0
        for row in reader:
            old_person_id = row["Person ID"]
            if not old_person_id or old_person_id.strip() == "":
                skipped += 1
                continue

            old_person_id = int(old_person_id)
            if old_person_id not in id_mapping:
                skipped += 1
                continue

            address = Address(
                person_id=id_mapping[old_person_id],
                address1=clean_string(row["Address1"]),
                address2=clean_string(row["Address2"]),
                city=clean_string(row["City"]),
                state=clean_string(row["State"]),
                zip_code=clean_string(row["Zip"]),
                address_type=clean_string(row["Address Type"]),
            )
            session.add(address)
            count += 1

    await session.flush()
    print(f"  Imported {count} addresses (skipped {skipped})")


async def migrate_communications(session: AsyncSession, data_path: Path, id_mapping: dict[int, int]):
    """Import communications from CSV."""
    csv_path = data_path / "tblComm.csv"
    print(f"Importing communications from {csv_path}...")

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        count = 0
        skipped = 0
        for row in reader:
            old_person_id = row["Person ID"]
            if not old_person_id or old_person_id.strip() == "":
                skipped += 1
                continue

            old_person_id = int(old_person_id)
            if old_person_id not in id_mapping:
                skipped += 1
                continue

            comm = Communication(
                person_id=id_mapping[old_person_id],
                comm_type=clean_string(row["Comm Type"]),
                detail=clean_string(row["Detail"]),
            )
            session.add(comm)
            count += 1

    await session.flush()
    print(f"  Imported {count} communications (skipped {skipped})")


async def migrate_attributes(session: AsyncSession, data_path: Path, id_mapping: dict[int, int]):
    """Import attributes from CSV."""
    csv_path = data_path / "tblAttrib.csv"
    print(f"Importing attributes from {csv_path}...")

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        count = 0
        skipped = 0
        for row in reader:
            old_person_id = row["Person ID"]
            if not old_person_id or old_person_id.strip() == "":
                skipped += 1
                continue

            old_person_id = int(old_person_id)
            if old_person_id not in id_mapping:
                skipped += 1
                continue

            attrib = Attribute(
                person_id=id_mapping[old_person_id],
                attrib_type=clean_string(row["Attrib Type"]),
                detail=clean_string(row["Detail"]),
            )
            session.add(attrib)
            count += 1

    await session.flush()
    print(f"  Imported {count} attributes (skipped {skipped})")


async def run_migration(database_url: str, data_path: str):
    """Run the full migration."""
    print(f"\nMigrating data from {data_path} to database...")
    print(f"Database URL: {database_url[:50]}...")

    engine = create_async_engine(database_url, echo=False)
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Run migrations
    async with async_session_maker() as session:
        try:
            data_path = Path(data_path)

            await migrate_lookup_codes(session, data_path)
            id_mapping = await migrate_persons(session, data_path)
            await migrate_addresses(session, data_path, id_mapping)
            await migrate_communications(session, data_path, id_mapping)
            await migrate_attributes(session, data_path, id_mapping)

            await session.commit()
            print("\nMigration completed successfully!")

        except Exception as e:
            await session.rollback()
            print(f"\nMigration failed: {e}")
            raise

    await engine.dispose()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Migrate Access DB data to PostgreSQL")
    parser.add_argument(
        "--database-url",
        default=os.environ.get("DATABASE_URL", "postgresql+asyncpg://contacts:contacts@localhost:5432/contacts"),
        help="Database URL",
    )
    parser.add_argument(
        "--data-path",
        default=DEFAULT_DATA_PATH,
        help="Path to exported CSV data files",
    )

    args = parser.parse_args()

    asyncio.run(run_migration(args.database_url, args.data_path))
