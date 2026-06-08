from fastapi import FastAPI
from pydantic import BaseModel
app = FastAPI()

@app.get("/")
def home():
    return {"message": "Hello World"}

@app.get("/students/{student_id}")
def get_student(student_id : int):
    return {"student_id": student_id}

@app.get("/search")
def search(name : str):
    return {"name": name}

@app.get("/students/{student_id}/courses/{course_id}")
def get_course(student_id : int,course_id:int):
    return{
        "student_id" : student_id,
        "course_id" : course_id
    }

@app.get("/products")
def get_products(page: int=1):
    return{
        "page" : page
    }

# Request Model

class Student(BaseModel):
    name: str
    age: int
@app.post("/students")
def create_student(student: Student):
    return student

# Response Model

class UserResponse(BaseModel):
    id: int
    name: str
@app.get("/user",response_model=UserResponse)
def get_user():
    return {
        "id" : 1,
        "name" : "Megha",
        "password" : "secret"
    }

