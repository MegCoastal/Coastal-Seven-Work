from pydantic import BaseModel, Field

class User(BaseModel):
    name: str
    age: int

class User(BaseModel):
    name: str = Field(
        min_length=3,
        max_length=20
    )

    age: int = Field(
        ge=18,
        le=60
    )

    phone: str = Field(
        pattern = r"^[0-9]{10}$"
    )

#Field Validator
class User(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def validate_name(cls,value):
        if value.lower() == "admin":
            raise ValueError(
                "admin not allowed"
            )
        return value
    
#Model Validator
class User(BaseModel):
    password: str
    confirm_password: str

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError(
                "Passwords do not match"
            )
        return self
    
#json scheme extra
#shows an example when you open post on swaggers

class User(BaseModel):
    name: str
    age: int

    model_config = ConfigDict(
        json_scheme_extra = {
            "example" : {
            "name": "Megha",
            "age" : 21
            }
        }
    )

