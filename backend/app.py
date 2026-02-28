# import json
# import os
# import faiss
# import numpy as np
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from openai import OpenAI
# from dotenv import load_dotenv

# # -----------------------------
# # Load Environment Variables
# # -----------------------------
# load_dotenv()
# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# print("KEY:", OPENAI_API_KEY)

# # -----------------------------
# # OpenRouter Client
# # -----------------------------
# client = OpenAI(
#     api_key=OPENAI_API_KEY,
#     base_url="https://openrouter.ai/api/v1"
# )

# # -----------------------------
# # FastAPI App
# # -----------------------------
# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173", "https://ai-agent-project-1-kq4v.onrender.com"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # -----------------------------
# # Load Issues
# # -----------------------------
# with open("bank_issues.json", "r", encoding="utf-8") as f:
#     issues = json.load(f)

# # -----------------------------
# # Prepare Texts for Embedding
# # (No numbering here – keep embeddings clean)
# # -----------------------------
# texts = []
# for issue in issues:
#     titles = issue.get("issue_titles") or [issue.get("issue_title", "")]
#     titles = [t.strip() for t in titles if t.strip()]
#     symptoms = issue.get("symptoms", [])
#     texts.append(f"{' '.join(titles)} {' '.join(symptoms)}")

# # -----------------------------
# # Build Embeddings (ONCE)
# # -----------------------------
# embeddings = []
# for text in texts:
#     embedding = client.embeddings.create(
#         model="openai/text-embedding-3-small",
#         input=text
#     ).data[0].embedding
#     embeddings.append(embedding)

# dimension = len(embeddings[0])
# index = faiss.IndexFlatL2(dimension)
# index.add(np.array(embeddings).astype("float32"))

# # -----------------------------
# # Request Models
# # -----------------------------
# class QueryRequest(BaseModel):
#     user_query: str


# class EscalationRequest(BaseModel):
#     issue_id: str
#     user_comments: str | None = None

# # -----------------------------
# # Query API
# # -----------------------------
# @app.post("/query")
# def query_issue(req: QueryRequest):
#     query_embedding = client.embeddings.create(
#         model="openai/text-embedding-3-small",
#         input=req.user_query
#     ).data[0].embedding

#     _, indexes = index.search(
#         np.array([query_embedding]).astype("float32"), 1
#     )

#     issue = issues[indexes[0][0]]

#     raw_titles = issue.get("issue_titles") or [issue.get("issue_title", "")]
#     raw_titles = [t.strip() for t in raw_titles if t.strip()]

#     # ✅ Numbered & newline-separated titles
#     identified_issue = "\n".join(
#         f"{i + 1}. {title}"
#         for i, title in enumerate(raw_titles)
#     )

#     return {
#         "issue_id": issue.get("issue_id"),
#         "identified_issue": identified_issue,
#         "root_cause": issue.get("root_cause", ""),
#         "resolution_steps": issue.get("resolution_steps", []),
#         "step_assets": issue.get("step_assets", {}),
#         "reference_queries": issue.get("reference_queries", {}),
#         "escalation_required": issue.get("escalation", False)
#     }

# # -----------------------------
# # Escalation API
# # -----------------------------
# @app.post("/escalate")
# def escalate_issue(req: EscalationRequest):
#     """
#     POC escalation handler
#     Future:
#     - ServiceNow / Remedy
#     - Email
#     - CBS Ticket
#     """

#     ticket_id = f"CBS-{np.random.randint(10000, 99999)}"

#     return {
#         "status": "ESCALATED",
#         "ticket_id": ticket_id,
#         "message": "Issue escalated to CBS support team"
#     }
import json
import os
try:
    import faiss
except ImportError:
    faiss = None
import numpy as np
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

# -----------------------------
# Load Environment Variables
# -----------------------------
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# -----------------------------
# OpenRouter Client
# -----------------------------
client = OpenAI(
    api_key=OPENAI_API_KEY,
    base_url="https://openrouter.ai/api/v1"
)

# -----------------------------
# FastAPI App
# -----------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://ai-agent-project-1-kq4v.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Load Issues
# -----------------------------
with open("bank_issues.json", "r", encoding="utf-8") as f:
    issues = json.load(f)

# -----------------------------
# Prepare Texts for Embedding
# (No numbering here – keep embeddings clean)
# -----------------------------
texts = []
for issue in issues:
    titles = issue.get("issue_titles") or [issue.get("issue_title", "")]
    titles = [t.strip() for t in titles if t.strip()]
    symptoms = issue.get("symptoms", [])
    texts.append(f"{' '.join(titles)} {' '.join(symptoms)}")

# -----------------------------
# Build Embeddings (ONCE)
# -----------------------------
# index is optional; if faiss is not installed we skip similarity functionality
index = None
if faiss is not None:
    try:
        embeddings = []
        for text in texts:
            embedding = client.embeddings.create(
                model="openai/text-embedding-3-small",
                input=text
            ).data[0].embedding
            embeddings.append(embedding)

        if embeddings:
            dimension = len(embeddings[0])
            index = faiss.IndexFlatL2(dimension)
            index.add(np.array(embeddings).astype("float32"))
    except Exception as e:
        # log error & continue without index
        print(f"[warning] failed to build embeddings: {e}")
        index = None

# -----------------------------
# Request Models
# -----------------------------
class QueryRequest(BaseModel):
    user_query: str


class EscalationRequest(BaseModel):
    issue_id: str
    user_comments: str | None = None
    system: str | None = None
    reporter_name: str | None = None
    reporter_email: str | None = None
    reporter_phone: str | None = None
    search_query: str | None = None

# -----------------------------
# Query API
# -----------------------------
@app.post("/query")
def query_issue(req: QueryRequest):
    query_embedding = client.embeddings.create(
        model="openai/text-embedding-3-small",
        input=req.user_query
    ).data[0].embedding

    if index is not None:
        _, indexes = index.search(
            np.array([query_embedding]).astype("float32"), 1
        )
        issue = issues[indexes[0][0]]
    else:
        # fallback: return first issue and note that vector search unavailable
        issue = issues[0]


    raw_titles = issue.get("issue_titles") or [issue.get("issue_title", "")]
    raw_titles = [t.strip() for t in raw_titles if t.strip()]

    # ✅ Numbered & newline-separated titles
    identified_issue = "\n".join(
        f"{i + 1}. {title}"
        for i, title in enumerate(raw_titles)
    )

    return {
        "issue_id": issue.get("issue_id"),
        "system": issue.get("system"),
        "identified_issue": identified_issue,
        "root_cause": issue.get("root_cause", ""),
        "resolution_steps": issue.get("resolution_steps", []),
        "step_assets": issue.get("step_assets", {}),
        "reference_queries": issue.get("reference_queries", {}),
        "escalation_required": issue.get("escalation", False)
    }

# -----------------------------
# Escalation API
# -----------------------------
@app.post("/escalate")
def escalate_issue(req: EscalationRequest):
    """
    POC escalation handler
    Future:
    - ServiceNow / Remedy
    - Email
    - CBS Ticket
    """

    # determine support team from system field
    team = "CBS"
    if req.system:
        s = req.system.lower()
        if "compass" in s or "aml" in s:
            team = "AML"
        elif "sdk" in s or "digital" in s:
            team = "Digital"

    ticket_id = f"{team}-{np.random.randint(10000, 99999)}"

    # structured event to help debugging / auditing
    event = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "ticket_id": ticket_id,
        "target_team": team,
        "issue_id": req.issue_id,
        "system": req.system,
        "search_query": req.search_query,
        "user_comments": req.user_comments,
        "reporter": {
            "name": req.reporter_name,
            "email": req.reporter_email,
            "phone": req.reporter_phone,
        }
    }

    log_path = "escalation_events.jsonl"
    log_error = None
    try:
        with open(log_path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(event, ensure_ascii=False) + "\n")
    except Exception as e:
        log_error = str(e)

    response = {
        "status": "ESCALATED",
        "ticket_id": ticket_id,
        "message": f"Issue escalated to {team} support team",
        "target_team": team,
        "log_path": log_path,
        "log_error": log_error,
    }

    return response