import os
import json
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
import uvicorn
import llm as llm_module
from prompts import PROMPTS

app = FastAPI()

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "ok"}

# Helper to process request body and call LLM
async def process_endpoint(request: Request, prompt_name: str):
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    if prompt_name not in PROMPTS:
        raise HTTPException(status_code=500, detail="Prompt not found")

    prompt = PROMPTS[prompt_name].format(**data)
    # Call OpenRouter (synchronous helper)
    response = llm_module.call_openrouter(prompt)
    return response

# Define endpoints – each uses a different prompt template
@app.post("/maintenance")
async def maintenance(request: Request):
    # Expect JSON with 'issue' and 'asset'
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    if not isinstance(data, dict) or "issue" not in data or "asset" not in data:
        raise HTTPException(status_code=400, detail="Missing required fields: 'issue' and 'asset'")
    result = await process_endpoint(request, "maintenance")
    return JSONResponse(content=result)

@app.post("/dashboard")
async def dashboard(request: Request):
    # Expect JSON with 'available', 'allocated', 'maintenance', 'overdue'
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    required = ["available", "allocated", "maintenance", "overdue"]
    if not isinstance(data, dict) or any(k not in data for k in required):
        raise HTTPException(status_code=400, detail=f"Missing required fields: {required}")
    result = await process_endpoint(request, "dashboard")
    return JSONResponse(content=result)

@app.post("/audit")
async def audit(request: Request):
    # Accept an audit JSON object or array
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    if not isinstance(data, (dict, list)):
        raise HTTPException(status_code=400, detail="Audit data must be a JSON object or array")

    prompt = PROMPTS["audit"].format(data=json.dumps(data))
    result = llm_module.call_openrouter(prompt)
    return JSONResponse(content=result)

@app.post("/booking")
async def booking(request: Request):
    result = await process_endpoint(request, "booking")
    return JSONResponse(content=result)

@app.post("/description")
async def description(request: Request):
    result = await process_endpoint(request, "description")
    return JSONResponse(content=result)

@app.post("/chat")
async def chat(request: Request):
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    if not isinstance(data, dict) or "message" not in data:
        raise HTTPException(status_code=400, detail="Missing required field: 'message'")
    prompt = PROMPTS["chat"].format(
        context=data.get("context", ""), message=data.get("message", "")
    )
    result = llm_module.call_openrouter(prompt)
    return JSONResponse(content=result)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
