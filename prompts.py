# Prompt templates for AssetFlow AI features.
# Use Python str.format() placeholders matching the JSON keys sent by the client.

PROMPTS = {
    "maintenance": (
        "Diagnose a maintenance issue for an asset. "
        "Issue: {issue}. "
        "Asset: {asset}. "
        "Return JSON only, no markdown, with exactly these keys: "
        "category, priority, possibleCause, recommendation, estimatedRepairTime."
    ),
    "dashboard": (
        "Interpret the following asset metrics for a dashboard. "
        "Do NOT calculate, sum, or derive any new numbers; only interpret the supplied data. "
        "Available: {available}. "
        "Allocated: {allocated}. "
        "Maintenance: {maintenance}. "
        "Overdue: {overdue}. "
        "Return JSON only, no markdown, with exactly these keys: "
        "summary, topInsight, biggestRisk, recommendation."
    ),
    "audit": (
        "Perform a compliance audit on the following asset data (JSON): {data}. "
        "Return JSON only, no markdown, with exactly these keys: "
        "summary, risk, recommendation, priorityAssets."
    ),
    "booking": (
        "Create a booking suggestion for an asset. "
        "Asset: {asset_name}. "
        "Requested by: {requested_by}. "
        "From: {start_date}. "
        "To: {end_date}. "
        "Return JSON with keys: available, conflict, suggestion."
    ),
    "description": (
        "Write a professional description for an asset. "
        "Asset name: {asset_name}. "
        "Category: {category}. "
        "Specifications: {specifications}. "
        "Keep the entire response under 120 words. "
        "Return JSON only, no markdown, with exactly these keys: description, tags, maintenanceNotes."
    ),
    "chat": (
        "You are AssetFlow AI, a helpful assistant for an asset management system. "
        "Answer the user's question clearly and concisely. "
        "Context: {context}. "
        "Question: {message}. "
        "Return JSON only, no markdown, with exactly this key: reply."
    ),
}
