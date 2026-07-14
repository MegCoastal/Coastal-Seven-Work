from fastapi import FastAPI
from tasks import send_email
from celery.result import AsyncResult
from celery_app import celery
app = FastAPI()

@app.post("/send-email")
def trigger_email(email: str):
    task = send_email.delay(email)
    print("DEBUG EMAIL:", email)
    return {"task_id": task.id}

@app.get("/task/{task_id}")
def get_status(task_id: str):
    task = AsyncResult(task_id, app=celery)

    return {
        "state": task.state,
        "result": task.result
    }