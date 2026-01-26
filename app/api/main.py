from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
<<<<<<< HEAD
from routers import aircraft_models, categories, document_categories, documents, jobs, platforms, uploads
=======
from routers import aircraft_models, categories, documents, jobs, search, uploads
>>>>>>> 834d0a238fe3be78e3126c08e8f0631420ae1044

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
<<<<<<< HEAD
app.include_router(platforms.router)
=======
app.include_router(search.router)
>>>>>>> 834d0a238fe3be78e3126c08e8f0631420ae1044
app.include_router(uploads.router)


@app.get("/")
def read_root():
    return {"Hello": "World"}