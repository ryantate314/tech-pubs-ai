import re
from typing import Literal, Optional

from pydantic import BaseModel, field_validator, model_validator


class SerialRangeInput(BaseModel):
    range_type: Literal["single", "range", "and_subs"]
    serial_start: str
    serial_end: Optional[str] = None

    @field_validator("serial_start")
    @classmethod
    def validate_serial_start_format(cls, v: str) -> str:
        if not re.match(r"^[0-9]+$", v):
            raise ValueError("serial_start must contain only digits")
        if len(v) > 10:
            raise ValueError("serial_start must be at most 10 characters")
        return v

    @field_validator("serial_end")
    @classmethod
    def validate_serial_end_format(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not re.match(r"^[0-9]+$", v):
            raise ValueError("serial_end must contain only digits")
        if len(v) > 10:
            raise ValueError("serial_end must be at most 10 characters")
        return v

    @model_validator(mode="after")
    def validate_serial_end(self) -> "SerialRangeInput":
        if self.range_type == "range":
            if self.serial_end is None:
                raise ValueError("serial_end is required for range type")
            if int(self.serial_end) < int(self.serial_start):
                raise ValueError("serial_end must be >= serial_start")
        elif self.serial_end is not None:
            raise ValueError("serial_end must be None for single and and_subs types")
        return self


class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str
    file_size: int
    document_name: str
    aircraft_model_id: int
    platform_id: int
    generation_id: int
    document_type_id: int
    version_name: str
    document_guid: Optional[str] = None
    serial_ranges: Optional[list[SerialRangeInput]] = None


class UploadUrlResponse(BaseModel):
    upload_url: str
    blob_path: str


class UploadCompleteRequest(BaseModel):
    blob_path: str
    document_name: str
    filename: str
    content_type: str
    file_size: int
    aircraft_model_id: int
    platform_id: int
    generation_id: int
    document_type_id: int
    version_name: str
    document_guid: Optional[str] = None
    serial_ranges: Optional[list[SerialRangeInput]] = None


class UploadCompleteResponse(BaseModel):
    document_id: int
    job_id: int
