import os
import json
from datetime import datetime

LOG_FILE = "cost_logs.json"

def get_empty_logs():
    return {
        "total_calls": 0,
        "total_input_tokens": 0,
        "total_output_tokens": 0,
        "total_cost_usd": 0.0,
        "history": []
    }

def read_logs():
    if not os.path.exists(LOG_FILE):
        return get_empty_logs()
    try:
        with open(LOG_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return get_empty_logs()

def log_llm_call(model_name: str, prompt_tokens: int, completion_tokens: int):
    logs = read_logs()
    
    logs["total_calls"] += 1
    logs["total_input_tokens"] += prompt_tokens
    logs["total_output_tokens"] += completion_tokens
    
    # Pricing is $0.00 because we are utilizing free tier integrations (Groq, Gemini, HF, Mistral)
    call_cost = 0.00 
    logs["total_cost_usd"] += call_cost

    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "model": model_name,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "cost_usd": call_cost
    }
    
    # Cap history list size at 100 entries to save space
    logs["history"].insert(0, log_entry)
    logs["history"] = logs["history"][:100]
    
    try:
        with open(LOG_FILE, "w") as f:
            json.dump(logs, f, indent=2)
    except Exception as e:
        print(f"Failed writing cost tracker log: {e}")
