
from contextlib import asynccontextmanager

from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from monitoring_service import monitor_due_loans


scheduler = AsyncIOScheduler()


async def run_monitoring():
    print("Starting scheduled loan risk monitoring...")

    results = await monitor_due_loans()

    for result in results:
        print(result)

    print("Loan risk monitoring completed.")


@asynccontextmanager
async def lifespan(app: FastAPI):

    # Run the scheduler every day to check for loans
    # whose next assessment date is due.
    scheduler.add_job(
        run_monitoring,
        trigger="interval",
        days=1,
        id="loan_risk_monitoring",
        replace_existing=True,
        max_instances=1,
        coalesce=True
    )

    scheduler.start()

    print("Loan risk monitoring scheduler started.")

    yield

    scheduler.shutdown(wait=False)
    print("Loan risk monitoring scheduler stopped.")