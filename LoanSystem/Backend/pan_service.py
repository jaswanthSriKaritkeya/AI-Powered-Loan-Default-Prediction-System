import os
import httpx
from dotenv import load_dotenv

load_dotenv()

PAN_API_URL = os.getenv("PAN_API_URL")


async def fetch_pan_details(pan: str):

    url = f"{PAN_API_URL}/pan/{pan}"

    async with httpx.AsyncClient(timeout=30.0) as client:

        response = await client.get(url)

        response.raise_for_status()

        return response.json()