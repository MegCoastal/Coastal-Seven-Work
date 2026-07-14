from celery import Celery

celery = Celery(
    "worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
    include=["tasks"]
)

celery.conf.task_track_started = True