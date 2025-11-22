from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.person import Person


class Address(Base):
    __tablename__ = "addresses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    person_id: Mapped[int] = mapped_column(ForeignKey("persons.id"), index=True)
    address1: Mapped[Optional[str]] = mapped_column(String(100))
    address2: Mapped[Optional[str]] = mapped_column(String(100))
    city: Mapped[Optional[str]] = mapped_column(String(50))
    state: Mapped[Optional[str]] = mapped_column(String(10))
    zip_code: Mapped[Optional[str]] = mapped_column(String(20))
    address_type: Mapped[Optional[str]] = mapped_column(String(10))

    person: Mapped["Person"] = relationship("Person", back_populates="addresses")

    @property
    def full_address(self) -> str:
        parts = []
        if self.address1:
            parts.append(self.address1)
        if self.address2:
            parts.append(self.address2)
        city_state_zip = []
        if self.city:
            city_state_zip.append(self.city)
        if self.state:
            city_state_zip.append(self.state)
        if self.zip_code:
            city_state_zip.append(self.zip_code)
        if city_state_zip:
            parts.append(", ".join(city_state_zip))
        return "\n".join(parts)
