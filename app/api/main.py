from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import aircraft_models, categories, document_categories, documents, jobs, platforms, uploads

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(aircraft_models.router)
app.include_router(categories.router)
app.include_router(documents.router)
app.include_router(document_categories.router)
app.include_router(jobs.router)
app.include_router(platforms.router)
app.include_router(uploads.router)


@app.get("/")
def read_root():
    return {"Hello": "World"}