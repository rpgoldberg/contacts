from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class LookupCode(Base):
    __tablename__ = "lookup_codes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    field_name: Mapped[str] = mapped_column(String(50), index=True)
    code: Mapped[str] = mapped_column(String(10))
    description: Mapped[str] = mapped_column(String(100))
