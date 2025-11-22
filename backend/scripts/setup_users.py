#!/usr/bin/env python3
"""
Setup script to create initial users and configure sharing.
"""

import asyncio
import os
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.database import Base
from app.models.user import User
from app.auth import hash_password


async def setup_users(database_url: str, users_config: list[dict], shares: list[tuple[str, str]]):
    """Create users and configure sharing."""
    print(f"Setting up users...")

    engine = create_async_engine(database_url, echo=False)
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as session:
        created_users = {}

        for user_config in users_config:
            username = user_config["username"]
            password = user_config["password"]

            # Check if user exists
            query = select(User).where(User.username == username)
            result = await session.execute(query)
            existing = result.scalar_one_or_none()

            if existing:
                print(f"  User '{username}' already exists")
                created_users[username] = existing
            else:
                user = User(
                    username=username,
                    hashed_password=hash_password(password),
                )
                session.add(user)
                await session.flush()
                await session.refresh(user)
                created_users[username] = user
                print(f"  Created user '{username}'")

        # Configure sharing
        for owner_username, shared_with_username in shares:
            owner = created_users.get(owner_username)
            shared_with = created_users.get(shared_with_username)

            if owner and shared_with:
                if shared_with not in owner.shared_with:
                    owner.shared_with.append(shared_with)
                    print(f"  Shared '{owner_username}' data with '{shared_with_username}'")
                else:
                    print(f"  Already shared '{owner_username}' with '{shared_with_username}'")

        await session.commit()
        print("\nUser setup completed!")

    await engine.dispose()


async def assign_owner_to_existing_contacts(database_url: str, owner_username: str):
    """Assign an owner to all existing contacts that don't have one."""
    from app.models import Person

    print(f"\nAssigning owner '{owner_username}' to existing contacts...")

    engine = create_async_engine(database_url, echo=False)
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session_maker() as session:
        # Get the owner user
        query = select(User).where(User.username == owner_username)
        result = await session.execute(query)
        owner = result.scalar_one_or_none()

        if not owner:
            print(f"  Error: User '{owner_username}' not found!")
            return

        # Update all persons without an owner
        query = select(Person).where(Person.owner_id.is_(None))
        result = await session.execute(query)
        persons = result.scalars().all()

        count = 0
        for person in persons:
            person.owner_id = owner.id
            count += 1

        await session.commit()
        print(f"  Assigned {count} contacts to '{owner_username}'")

    await engine.dispose()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Setup users and sharing")
    parser.add_argument(
        "--database-url",
        default=os.environ.get("DATABASE_URL", "postgresql+asyncpg://contacts:contacts@localhost:5432/contacts"),
        help="Database URL",
    )

    args = parser.parse_args()

    # Default user configuration
    users = [
        {"username": "mindsignals", "password": "changeme123"},
        {"username": "momo", "password": "changeme456"},
    ]

    # Share mindsignals data with momo
    shares = [
        ("mindsignals", "momo"),
    ]

    asyncio.run(setup_users(args.database_url, users, shares))
    asyncio.run(assign_owner_to_existing_contacts(args.database_url, "mindsignals"))
