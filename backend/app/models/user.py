from sqlalchemy import String, Boolean, ForeignKey, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

# Association table for user sharing
user_shares = Table(
    "user_shares",
    Base.metadata,
    Column("owner_id", ForeignKey("users.id"), primary_key=True),
    Column("shared_with_id", ForeignKey("users.id"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Users this user has shared their data with (full CRUD access)
    shared_with: Mapped[list["User"]] = relationship(
        "User",
        secondary=user_shares,
        primaryjoin=id == user_shares.c.owner_id,
        secondaryjoin=id == user_shares.c.shared_with_id,
        backref="has_access_to",
    )
