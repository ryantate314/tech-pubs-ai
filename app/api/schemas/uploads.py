from typing import Optional

from pydantic import BaseModel


class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str
    file_size: int
    document_name: str
    aircraft_model_id: int
    category_id: int
<<<<<<< HEAD
    platform_id: Optional[int] = None
    generation_id: Optional[int] = None
    document_type_id: Optional[int] = None
=======
    version_name: str
    document_guid: Optional[str] = None
>>>>>>> 834d0a238fe3be78e3126c08e8f0631420ae1044


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
<<<<<<< HEAD
    platform_id: Optional[int] = None
    generation_id: Optional[int] = None
    document_type_id: Optional[int] = None
=======
    version_name: str
    document_guid: Optional[str] = None
>>>>>>> 834d0a238fe3be78e3126c08e8f0631420ae1044


class UploadCompleteResponse(BaseModel):
    document_id: int
    job_id: int
