from datetime import date
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.address import Address
    from app.models.communication import Communication
    from app.models.attribute import Attribute


class Person(Base):
    __tablename__ = "persons"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    owner_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), index=True)
    first_name: Mapped[Optional[str]] = mapped_column(String(50))
    middle_initial: Mapped[Optional[str]] = mapped_column(String(5))
    last_name: Mapped[Optional[str]] = mapped_column(String(50))
    birth_date: Mapped[Optional[date]] = mapped_column(Date)
    anniversary_date: Mapped[Optional[date]] = mapped_column(Date)
    relation: Mapped[Optional[str]] = mapped_column(String(10))
    title: Mapped[Optional[str]] = mapped_column(String(100))
    married_to: Mapped[Optional[str]] = mapped_column(String(100))
    decease_date: Mapped[Optional[date]] = mapped_column(Date)

    # Relationships
    addresses: Mapped[list["Address"]] = relationship(
        "Address", back_populates="person", cascade="all, delete-orphan"
    )
    communications: Mapped[list["Communication"]] = relationship(
        "Communication", back_populates="person", cascade="all, delete-orphan"
    )
    attributes: Mapped[list["Attribute"]] = relationship(
        "Attribute", back_populates="person", cascade="all, delete-orphan"
    )

    @property
    def full_name(self) -> str:
        parts = []
        if self.first_name:
            parts.append(self.first_name)
        if self.middle_initial:
            parts.append(self.middle_initial)
        if self.last_name:
            parts.append(self.last_name)
        return " ".join(parts)

    @property
    def display_name(self) -> str:
        if self.last_name and self.first_name:
            if self.middle_initial:
                return f"{self.last_name}, {self.first_name} {self.middle_initial}"
            return f"{self.last_name}, {self.first_name}"
        return self.last_name or self.first_name or f"Person {self.id}"
