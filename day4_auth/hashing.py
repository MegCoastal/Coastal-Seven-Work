from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(
    plain_password,
    hashed_password
):
    return pwd_context.verify(
        plain_password,
        hashed_password
    )
user = "sri123"
password = "shyam123"
hashed = hash_password(password)
print(hashed)
print(verify_password(
    user,
    hashed
)
)

