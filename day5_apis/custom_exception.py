from fastapi import Request
from fastapi.responses import JSONResponse

class ProductNotFound(Exception):
    pass

@app.exception_handler(ProductNotFound)
async def product_not_found_handler(request: Request, exc: ProductNotFound):
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "error": {
                "code": "PRODUCT_NOT_FOUND",
                "message": "Product not found"
            }
        }
    )