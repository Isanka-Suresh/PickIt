"""
PickIt Recommendation API (CSV version)
=========================================
FastAPI microservice serving all three recommendation models.

Setup:
    pip install fastapi uvicorn scikit-learn numpy pandas

Run locally:
    uvicorn pickit_recommendation_api:app --reload --port 8000

Run in Google Colab:
    See bottom of this file for Colab-specific startup code.

Endpoints:
    GET /health
    GET /metrics
    GET /recommend/combo?product_ids=id1,id2&n=3
    GET /recommend/personal?customer_id=xxx&n=5
    GET /recommend/substitute?product_id=xxx&in_stock_ids=id1,id2&n=3
"""

import os, pickle, json
import numpy as np
from fastapi import FastAPI, Query, HTTPException
from typing import Optional

# ── Paths ─────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# ── Load models ───────────────────────────────────────────────────
with open(os.path.join(MODELS_DIR, "apriori_rules.pkl"), "rb") as f:
    RULES = pickle.load(f)

with open(os.path.join(MODELS_DIR, "svd_model.pkl"), "rb") as f:
    svd       = pickle.load(f)
    R_PRED    = svd["R_pred"]
    R_MATRIX  = svd["R"]
    CUST_IDX  = svd["cust_idx"]
    CUSTOMERS = svd["customers"]
    PRODUCTS  = svd["products"]

with open(os.path.join(MODELS_DIR, "content_model.pkl"), "rb") as f:
    cb            = pickle.load(f)
    COS_SIM       = cb["cos_sim"]
    FEAT_PRODUCTS = cb["feat_products"]
    FEAT_IDX      = cb["feat_idx"]
    ML_FEAT       = cb["ml_feat"]

with open(os.path.join(MODELS_DIR, "all_metrics.json")) as f:
    ALL_METRICS = json.load(f)

PROD_NAME = dict(zip(ML_FEAT["product_id"], ML_FEAT["name"]))

# ── App ───────────────────────────────────────────────────────────
app = FastAPI(
    title="PickIt Recommendation API",
    description="AI-powered product recommendations — combo, personal, and substitute",
    version="1.0.0"
)


# ══════════════════════════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════════════════════════

@app.get("/health")
def health():
    return {
        "status":        "ok",
        "models_loaded": ["apriori", "svd", "content_based"],
        "rules_count":   len(RULES)
    }


@app.get("/metrics")
def metrics():
    """Performance metrics for all three models."""
    return ALL_METRICS


@app.get("/recommend/combo")
def combo_recommendations(
    product_ids: str = Query(..., description="Comma-separated product IDs currently in cart"),
    n: int = Query(3, description="Number of recommendations to return")
):
    """
    Apriori — products frequently bought together with cart items.
    Trigger: every time customer adds a product to cart.
    """
    cart = set(product_ids.split(","))
    hits = {}
    for rule in RULES:
        if set(rule["antecedent"]).issubset(cart):
            for pid in rule["consequent"]:
                if pid not in cart:
                    if pid not in hits or rule["lift"] > hits[pid]["lift"]:
                        hits[pid] = {
                            "product_id":   pid,
                            "product_name": PROD_NAME.get(pid, pid),
                            "reason":       "Frequently bought with " +
                                            ", ".join(PROD_NAME.get(p, p) for p in rule["antecedent"]),
                            "confidence":   rule["confidence"],
                            "lift":         rule["lift"]
                        }
    results = sorted(hits.values(), key=lambda x: x["lift"], reverse=True)[:n]
    return {"type": "combo", "recommendations": results}


@app.get("/recommend/personal")
def personal_recommendations(
    customer_id: str = Query(..., description="Customer UUID"),
    n: int = Query(5, description="Number of recommendations to return"),
    exclude_purchased: bool = Query(True, description="Hide already purchased products")
):
    """
    SVD — personalised picks based on this customer's purchase history.
    Trigger: home screen / 'You might like' section.
    Cold-start fallback: returns most popular products for new customers.
    """
    if customer_id not in CUST_IDX:
        # cold start — return most popular products
        popularity = R_MATRIX.sum(axis=0)
        top_idx    = np.argsort(popularity)[::-1][:n]
        return {
            "type":      "personal",
            "cold_start": True,
            "recommendations": [
                {"product_id": PRODUCTS[j], "product_name": PROD_NAME.get(PRODUCTS[j], PRODUCTS[j]), "score": None}
                for j in top_idx
            ]
        }

    i      = CUST_IDX[customer_id]
    scores = R_PRED[i].copy()
    if exclude_purchased:
        scores[R_MATRIX[i] > 0] = -999

    top_idx = np.argsort(scores)[::-1][:n]
    results = [
        {
            "product_id":   PRODUCTS[j],
            "product_name": PROD_NAME.get(PRODUCTS[j], PRODUCTS[j]),
            "score":        round(float(scores[j]), 3)
        }
        for j in top_idx if scores[j] > -999
    ]
    return {"type": "personal", "cold_start": False, "recommendations": results}


@app.get("/recommend/substitute")
def substitute_recommendations(
    product_id: str = Query(..., description="UUID of the out-of-stock product"),
    in_stock_ids: Optional[str] = Query(None, description="Comma-separated UUIDs of products currently in stock"),
    n: int = Query(3, description="Number of substitutes to return")
):
    """
    Content-based cosine similarity — find similar in-stock alternatives.
    Trigger: when a product in the cart goes out of stock.
    """
    if product_id not in FEAT_IDX:
        raise HTTPException(status_code=404, detail="Product not found")

    in_stock = set(in_stock_ids.split(",")) if in_stock_ids else None
    i        = FEAT_IDX[product_id]
    scores   = sorted(enumerate(COS_SIM[i]), key=lambda x: x[1], reverse=True)

    results = []
    for j, score in scores:
        if j == i:
            continue
        pid = FEAT_PRODUCTS[j]
        if in_stock and pid not in in_stock:
            continue
        results.append({
            "product_id":   pid,
            "product_name": PROD_NAME.get(pid, pid),
            "similarity":   round(float(score), 4),
            "reason":       "Similar product — same category and brand attributes"
        })
        if len(results) == n:
            break

    return {
        "type":            "substitute",
        "out_of_stock":    {"product_id": product_id, "product_name": PROD_NAME.get(product_id, product_id)},
        "recommendations": results
    }


# ══════════════════════════════════════════════════════════════════
# GOOGLE COLAB STARTUP
# ══════════════════════════════════════════════════════════════════
# To run this API inside Google Colab, add a new cell and run:
#
#   import nest_asyncio, uvicorn
#   from pyngrok import ngrok
#   nest_asyncio.apply()
#
#   public_url = ngrok.connect(8000)
#   print("Public API URL:", public_url)
#
#   uvicorn.run(app, host="0.0.0.0", port=8000)
#
# Then open:  <public_url>/docs   for the interactive Swagger UI
# ══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
