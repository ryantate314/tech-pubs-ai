from pydantic import BaseModel


class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str
    file_size: int
    document_name: str
    aircraft_model_id: int
    category_id: int


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


class UploadCompleteResponse(BaseModel):
    document_id: int
    job_id: int
