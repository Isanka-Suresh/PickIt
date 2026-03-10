"""
PickIt Recommendation Model — Training Pipeline (CSV version)
==============================================================
Run this FIRST to train all models and save artefacts to ./models/

Three models:
  Model 1 – Apriori       : Combo / frequently-bought-together
  Model 2 – SVD (numpy)   : Personalised recommendations
  Model 3 – TF-IDF Cosine : Out-of-stock substitute finder

Usage:
  python pickit_recommendation_model.py
"""

import os, pickle, json, warnings
import numpy as np
import pandas as pd
from itertools import combinations
from collections import defaultdict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import KFold
from sklearn.metrics import mean_squared_error

warnings.filterwarnings("ignore")

# ── Paths ─────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_DIR   = os.path.join(BASE_DIR, "pickit_data")   # folder with CSV files
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

# ══════════════════════════════════════════════════════════════════
# 0.  LOAD DATA
# ══════════════════════════════════════════════════════════════════
print("=" * 60)
print("  PickIt Recommendation Model — Training Pipeline")
print("=" * 60)

orders  = pd.read_csv(os.path.join(DATA_DIR, "orders.csv"))
items   = pd.read_csv(os.path.join(DATA_DIR, "order_items.csv"))
ml_tx   = pd.read_csv(os.path.join(DATA_DIR, "ml_transactions.csv"))
ml_feat = pd.read_csv(os.path.join(DATA_DIR, "ml_products_features.csv"))

completed_ids = set(orders[orders["status"] == "completed"]["id"])
items_c = items[items["order_id"].isin(completed_ids)].copy()

print(f"\n  Completed orders : {len(completed_ids)}")
print(f"  Line items       : {len(items_c)}")
print(f"  Unique customers : {ml_tx['customer_id'].nunique()}")
print(f"  Unique products  : {ml_tx['product_id'].nunique()}")


# ══════════════════════════════════════════════════════════════════
# MODEL 1 — APRIORI  (from scratch)
# ══════════════════════════════════════════════════════════════════
print("\n" + "─" * 60)
print("  MODEL 1 — Apriori (Association Rule Mining)")
print("─" * 60)

baskets        = items_c.groupby("order_id")["product_id"].apply(set).to_dict()
pid_name       = dict(zip(ml_feat["product_id"], ml_feat["name"]))
n_transactions = len(baskets)

def support(itemset, baskets):
    count = sum(1 for b in baskets.values() if itemset.issubset(b))
    return count / len(baskets)

def apriori(baskets, min_support=0.03, min_confidence=0.4, min_lift=1.2):
    basket_list = list(baskets.values())
    all_items   = sorted({p for b in basket_list for p in b})

    # frequent 1-itemsets
    freq = {}
    for item in all_items:
        s = support(frozenset([item]), baskets)
        if s >= min_support:
            freq[frozenset([item])] = s

    # frequent 2-itemsets
    freq_items = list(freq.keys())
    for c in [frozenset(c) for c in combinations([list(f)[0] for f in freq_items], 2)]:
        s = support(c, baskets)
        if s >= min_support:
            freq[c] = s

    # frequent 3-itemsets
    freq_2       = [k for k in freq if len(k) == 2]
    single_items = {list(f)[0] for f in freq_items}
    for f2 in freq_2:
        for item in single_items:
            if item not in f2:
                c = f2 | frozenset([item])
                if c not in freq:
                    s = support(c, baskets)
                    if s >= min_support:
                        freq[c] = s

    # generate rules
    rules = []
    for itemset, sup in freq.items():
        if len(itemset) < 2:
            continue
        for size in range(1, len(itemset)):
            for antecedent in combinations(itemset, size):
                antecedent = frozenset(antecedent)
                consequent = itemset - antecedent
                sup_ant    = freq.get(antecedent, support(antecedent, baskets))
                if sup_ant == 0:
                    continue
                conf    = sup / sup_ant
                sup_con = freq.get(consequent, support(consequent, baskets))
                lift    = conf / sup_con if sup_con > 0 else 0
                if conf >= min_confidence and lift >= min_lift:
                    rules.append({
                        "antecedent": list(antecedent),
                        "consequent": list(consequent),
                        "support":    round(sup, 4),
                        "confidence": round(conf, 4),
                        "lift":       round(lift, 4)
                    })

    rules.sort(key=lambda x: x["lift"], reverse=True)
    return rules

rules = apriori(baskets)
for r in rules:
    r["antecedent_names"] = [pid_name.get(p, p) for p in r["antecedent"]]
    r["consequent_names"] = [pid_name.get(p, p) for p in r["consequent"]]

avg_conf     = np.mean([r["confidence"] for r in rules]) if rules else 0
avg_lift     = np.mean([r["lift"]       for r in rules]) if rules else 0
avg_sup      = np.mean([r["support"]    for r in rules]) if rules else 0
strong_rules = [r for r in rules if r["confidence"] >= 0.6 and r["lift"] >= 1.5]

apriori_metrics = {
    "total_rules":         len(rules),
    "strong_rules":        len(strong_rules),
    "avg_confidence":      round(avg_conf, 4),
    "avg_lift":            round(avg_lift, 4),
    "avg_support":         round(avg_sup, 4),
    "min_support_used":    0.03,
    "min_confidence_used": 0.40,
    "min_lift_used":       1.20,
    "n_transactions":      n_transactions
}

print(f"\n  Rules discovered : {apriori_metrics['total_rules']}")
print(f"  Strong rules     : {apriori_metrics['strong_rules']}  (conf>=0.6, lift>=1.5)")
print(f"  Avg confidence   : {apriori_metrics['avg_confidence']}")
print(f"  Avg lift         : {apriori_metrics['avg_lift']}")
print("\n  Top 5 rules by lift:")
for r in rules[:5]:
    print(f"    {r['antecedent_names']} -> {r['consequent_names']}"
          f"  conf={r['confidence']}  lift={r['lift']}")

with open(os.path.join(MODELS_DIR, "apriori_rules.pkl"), "wb") as f:
    pickle.dump(rules, f)
with open(os.path.join(MODELS_DIR, "apriori_metrics.json"), "w") as f:
    json.dump(apriori_metrics, f, indent=2)
print("\n  ✓ Apriori model saved")


# ══════════════════════════════════════════════════════════════════
# MODEL 2 — SVD  (numpy matrix factorisation)
# ══════════════════════════════════════════════════════════════════
print("\n" + "─" * 60)
print("  MODEL 2 — SVD Matrix Factorisation (Collaborative Filtering)")
print("─" * 60)

customers = sorted(ml_tx["customer_id"].unique())
products  = sorted(ml_tx["product_id"].unique())
cust_idx  = {c: i for i, c in enumerate(customers)}
prod_idx  = {p: i for i, p in enumerate(products)}

R = np.zeros((len(customers), len(products)))
for _, row in ml_tx.iterrows():
    R[cust_idx[row["customer_id"]], prod_idx[row["product_id"]]] = row["implicit_rating"]

print(f"\n  Matrix shape : {R.shape[0]} customers x {R.shape[1]} products")
print(f"  Sparsity     : {(R == 0).sum() / R.size * 100:.1f}% zeros")

# mean-centre by user
user_mean = np.true_divide(R.sum(1), (R != 0).sum(1) + 1e-9)
R_centred = R.copy()
for i in range(R.shape[0]):
    R_centred[i, R[i] != 0] -= user_mean[i]

# full SVD
U, sigma, Vt = np.linalg.svd(R_centred, full_matrices=False)
K = 20
R_pred = U[:, :K] @ np.diag(sigma[:K]) @ Vt[:K, :]
for i in range(R_pred.shape[0]):
    R_pred[i] += user_mean[i]
R_pred = np.clip(R_pred, 1, 5)

# 5-fold cross-validation
kf           = KFold(n_splits=5, shuffle=True, random_state=42)
rated_coords = np.array(list(zip(*np.where(R > 0))))
np.random.seed(42)
np.random.shuffle(rated_coords)

rmse_list, mae_list, p5_list, r5_list = [], [], [], []

for train_idx, test_idx in kf.split(rated_coords):
    R_train = R.copy()
    for (i, j) in rated_coords[test_idx]:
        R_train[i, j] = 0

    um = np.true_divide(R_train.sum(1), (R_train != 0).sum(1) + 1e-9)
    Rc = R_train.copy()
    for i in range(Rc.shape[0]):
        Rc[i, R_train[i] != 0] -= um[i]

    U_, s_, Vt_ = np.linalg.svd(Rc, full_matrices=False)
    pred = U_[:, :K] @ np.diag(s_[:K]) @ Vt_[:K, :]
    for i in range(pred.shape[0]):
        pred[i] += um[i]
    pred = np.clip(pred, 1, 5)

    tv = [R[i, j] for (i, j) in rated_coords[test_idx]]
    pv = [pred[i, j] for (i, j) in rated_coords[test_idx]]
    rmse_list.append(np.sqrt(mean_squared_error(tv, pv)))
    mae_list.append(np.mean(np.abs(np.array(tv) - np.array(pv))))

    prec_f, rec_f = [], []
    for ui in range(R.shape[0]):
        unseen = np.where(R_train[ui] == 0)[0]
        if not len(unseen):
            continue
        top5 = unseen[np.argsort(pred[ui, unseen])[::-1][:5]]
        rel   = [j for j in unseen if R[ui, j] >= 3.5]
        if not rel:
            continue
        hits = sum(1 for j in top5 if R[ui, j] >= 3.5)
        prec_f.append(hits / 5)
        rec_f.append(hits / len(rel))
    if prec_f:
        p5_list.append(np.mean(prec_f))
        r5_list.append(np.mean(rec_f))

svd_metrics = {
    "latent_factors_K": K,
    "matrix_shape":     list(R.shape),
    "sparsity_pct":     round((R == 0).sum() / R.size * 100, 2),
    "cv_folds":         5,
    "rmse_mean":        round(float(np.mean(rmse_list)), 4),
    "rmse_std":         round(float(np.std(rmse_list)), 4),
    "mae_mean":         round(float(np.mean(mae_list)), 4),
    "mae_std":          round(float(np.std(mae_list)), 4),
    "precision_at_5":   round(float(np.mean(p5_list)), 4) if p5_list else None,
    "recall_at_5":      round(float(np.mean(r5_list)), 4) if r5_list else None,
    "f1_at_5":          round(
        2 * np.mean(p5_list) * np.mean(r5_list) /
        (np.mean(p5_list) + np.mean(r5_list) + 1e-9), 4
    ) if p5_list else None
}

print(f"\n  5-Fold Cross-Validation Results:")
print(f"    RMSE        : {svd_metrics['rmse_mean']} +/- {svd_metrics['rmse_std']}")
print(f"    MAE         : {svd_metrics['mae_mean']} +/- {svd_metrics['mae_std']}")
print(f"    Precision@5 : {svd_metrics['precision_at_5']}")
print(f"    Recall@5    : {svd_metrics['recall_at_5']}")
print(f"    F1@5        : {svd_metrics['f1_at_5']}")

svd_artefact = {
    "U_k": U[:, :K], "S_k": np.diag(sigma[:K]), "Vt_k": Vt[:K, :],
    "user_mean": user_mean,
    "cust_idx":  cust_idx,  "prod_idx": prod_idx,
    "customers": customers, "products": products,
    "R": R, "R_pred": R_pred
}
with open(os.path.join(MODELS_DIR, "svd_model.pkl"), "wb") as f:
    pickle.dump(svd_artefact, f)
with open(os.path.join(MODELS_DIR, "svd_metrics.json"), "w") as f:
    json.dump(svd_metrics, f, indent=2)
print("\n  ✓ SVD model saved")


# ══════════════════════════════════════════════════════════════════
# MODEL 3 — TF-IDF COSINE SIMILARITY  (Content-Based)
# ══════════════════════════════════════════════════════════════════
print("\n" + "─" * 60)
print("  MODEL 3 — TF-IDF Cosine Similarity (Substitute Finder)")
print("─" * 60)

tfidf         = TfidfVectorizer(ngram_range=(1, 2))
tfidf_mat     = tfidf.fit_transform(ml_feat["feature_text"])
cos_sim       = cosine_similarity(tfidf_mat, tfidf_mat)
feat_products = list(ml_feat["product_id"])
feat_idx      = {p: i for i, p in enumerate(feat_products)}

def get_substitutes(product_id, in_stock_ids=None, n=3):
    if product_id not in feat_idx:
        return []
    i      = feat_idx[product_id]
    scores = sorted(enumerate(cos_sim[i]), key=lambda x: x[1], reverse=True)
    results = []
    for j, score in scores:
        if j == i:
            continue
        pid = feat_products[j]
        if in_stock_ids and pid not in in_stock_ids:
            continue
        results.append({
            "product_id": pid,
            "name":       pid_name.get(pid, pid),
            "similarity": round(score, 4)
        })
        if len(results) == n:
            break
    return results

sims, cat_hits = [], []
for pid in feat_products:
    recs = get_substitutes(pid, n=3)
    if not recs:
        continue
    orig_cat = ml_feat[ml_feat["product_id"] == pid]["category"].values[0]
    sims.extend([r["similarity"] for r in recs])
    for r in recs:
        rc = ml_feat[ml_feat["product_id"] == r["product_id"]]["category"].values
        cat_hits.append(1 if len(rc) > 0 and rc[0] == orig_cat else 0)

cb_metrics = {
    "n_products":            len(feat_products),
    "avg_cosine_similarity": round(float(np.mean(sims)), 4),
    "min_cosine_similarity": round(float(np.min(sims)), 4),
    "max_cosine_similarity": round(float(np.max(sims)), 4),
    "category_hit_rate":     round(float(np.mean(cat_hits)), 4),
    "tfidf_vocab_size":      len(tfidf.vocabulary_)
}

print(f"\n  Avg cosine similarity : {cb_metrics['avg_cosine_similarity']}")
print(f"  Category hit-rate     : {cb_metrics['category_hit_rate']}")
print(f"  TF-IDF vocab size     : {cb_metrics['tfidf_vocab_size']}")

sample_pid = feat_products[0]
print(f"\n  Sample substitutes for '{pid_name.get(sample_pid)}':")
for s in get_substitutes(sample_pid, n=3):
    print(f"    -> {s['name']}  (similarity={s['similarity']})")

with open(os.path.join(MODELS_DIR, "content_model.pkl"), "wb") as f:
    pickle.dump({
        "tfidf": tfidf, "cos_sim": cos_sim,
        "feat_products": feat_products, "feat_idx": feat_idx,
        "ml_feat": ml_feat
    }, f)
with open(os.path.join(MODELS_DIR, "content_metrics.json"), "w") as f:
    json.dump(cb_metrics, f, indent=2)
print("\n  ✓ Content-based model saved")


# ══════════════════════════════════════════════════════════════════
# SAVE COMBINED METRICS
# ══════════════════════════════════════════════════════════════════
all_metrics = {
    "model_1_apriori":       apriori_metrics,
    "model_2_svd":           svd_metrics,
    "model_3_content_based": cb_metrics
}
with open(os.path.join(MODELS_DIR, "all_metrics.json"), "w") as f:
    json.dump(all_metrics, f, indent=2)

print("\n" + "=" * 60)
print("  ALL MODELS TRAINED SUCCESSFULLY")
print("=" * 60)
print("\n  Saved artefacts:")
for fn in sorted(os.listdir(MODELS_DIR)):
    size = os.path.getsize(os.path.join(MODELS_DIR, fn))
    print(f"    {fn:<35} {size/1024:.1f} KB")


# ══════════════════════════════════════════════════════════════════
# INFERENCE DEMO
# ══════════════════════════════════════════════════════════════════
print("\n" + "─" * 60)
print("  INFERENCE DEMO")
print("─" * 60)

sample_cust = customers[5]
sample_cart = [products[0], products[2]]
print(f"\n  Customer : {sample_cust[:16]}...")
print(f"  Cart     : {[pid_name.get(p) for p in sample_cart]}")

# Combo recs
cart_set   = set(sample_cart)
combo_hits = {}
for rule in rules:
    if set(rule["antecedent"]).issubset(cart_set):
        for pid in rule["consequent"]:
            if pid not in cart_set:
                if pid not in combo_hits or rule["lift"] > combo_hits[pid]["lift"]:
                    combo_hits[pid] = {
                        "name":       pid_name.get(pid, pid),
                        "confidence": rule["confidence"],
                        "lift":       rule["lift"]
                    }

print("\n  [Combo Recs - Apriori]")
top_combos = sorted(combo_hits.items(), key=lambda x: x[1]["lift"], reverse=True)[:3]
if top_combos:
    for pid, info in top_combos:
        print(f"    -> {info['name']:<30}  conf={info['confidence']:.2f}  lift={info['lift']:.2f}")
else:
    print("    (no rules matched this cart)")

# Personal recs
print("\n  [Personal Recs - SVD]")
i      = cust_idx[sample_cust]
scores = R_pred[i].copy()
scores[R[i] > 0] = -999
top5 = np.argsort(scores)[::-1][:5]
for j in top5:
    print(f"    -> {pid_name.get(products[j], products[j])}")

# Substitute
oos_pid = products[0]
print(f"\n  [Substitute - '{pid_name.get(oos_pid)}' is OUT OF STOCK]")
for s in get_substitutes(oos_pid, in_stock_ids=set(products[1:]), n=3):
    print(f"    -> {s['name']:<30}  similarity={s['similarity']}")

print("\n" + "=" * 60)
print("  Done. Models ready for API.")
print("=" * 60)
