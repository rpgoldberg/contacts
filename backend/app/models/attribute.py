from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.person import Person


class Attribute(Base):
    __tablename__ = "attributes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    person_id: Mapped[int] = mapped_column(ForeignKey("persons.id"), index=True)
    attrib_type: Mapped[Optional[str]] = mapped_column(String(20))
    detail: Mapped[Optional[str]] = mapped_column(String(255))

    person: Mapped["Person"] = relationship("Person", back_populates="attributes")
