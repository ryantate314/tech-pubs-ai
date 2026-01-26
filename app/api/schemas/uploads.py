from typing import Literal, Optional

from pydantic import BaseModel, model_validator


class SerialRangeInput(BaseModel):
    range_type: Literal["single", "range", "and_subs"]
    serial_start: int
    serial_end: Optional[int] = None

    @model_validator(mode="after")
    def validate_serial_end(self) -> "SerialRangeInput":
        if self.range_type == "range":
            if self.serial_end is None:
                raise ValueError("serial_end is required for range type")
            if self.serial_end < self.serial_start:
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
    category_id: int
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
    category_id: int
    version_name: str
    document_guid: Optional[str] = None
    serial_ranges: Optional[list[SerialRangeInput]] = None


class UploadCompleteResponse(BaseModel):
    document_id: int
    job_id: int
