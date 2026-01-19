from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import aircraft_models, categories, uploads

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
app.include_router(uploads.router)


@app.get("/")
def read_root():
    return {"Hello": "World"}