from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import uvicorn
from predict import predict_future_demand
import os

app = FastAPI(
    title="PickIt Demand Prediction API",
    description="Microservice for predicting future stock demand using Random Forest Regression",
    version="1.0.0"
)

# ==========================================
# 1. Pydantic Models for Input/Output validation
# ==========================================
class PredictionRequest(BaseModel):
    product_id: str
    days: int = 7 # Default to predicting the next 7 days

class PredictionResult(BaseModel):
    date: str
    product_id: str
    predicted_demand: int

class PredictionResponse(BaseModel):
    success: bool
    data: List[PredictionResult]
    message: str = ""

# ==========================================
# 2. Endpoints
# ==========================================
@app.get("/")
def root():
    return {"message": "Demand Prediction Service is running. Access /docs for the API Swagger UI."}

@app.post("/predict", response_model=PredictionResponse)
def get_prediction(req: PredictionRequest):
    """
    Returns forecasted demand for the specified product over the next `days` days.
    """
    
    # 1. Validate inputs
    if req.days <= 0 or req.days > 30:
        raise HTTPException(status_code=400, detail="Prediction days must be between 1 and 30")
        
    # 2. Call prediction logic
    results = predict_future_demand(req.product_id, req.days)
    
    if isinstance(results, dict) and "error" in results:
        # Happens if model isn't trained yet
        raise HTTPException(status_code=500, detail=results["error"])
        
    # 3. Return structured response
    return PredictionResponse(
        success=True,
        data=results,
        message=f"Successfully predicted demand for {req.days} days."
    )

# ==========================================
# 3. Entrypoint
# ==========================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    print(f"Starting server on port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
