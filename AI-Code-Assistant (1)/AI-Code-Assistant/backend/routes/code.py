from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models.history import History
from models.project import Project
from services.ai_service import ask_ai
from utils.helpers import strip_code_fences

router = APIRouter(tags=["Code Tools"])


def _log(db: Session, action: str, detail: str):
    db.add(History(action=action, detail=detail[:200]))
    db.commit()


# ---------------------------------------------------------------------------
# Request/response models
# ---------------------------------------------------------------------------

class GenerateRequest(BaseModel):
    prompt: str
    language: str = "python"


class CodeOnlyRequest(BaseModel):
    code: str
    language: Optional[str] = None


class ConvertRequest(BaseModel):
    code: str
    source_language: str
    target_language: str


class CodeResponse(BaseModel):
    result: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/generate-code", response_model=CodeResponse)
def generate_code(payload: GenerateRequest, db: Session = Depends(get_db)):
    system_prompt = (
        f"You are an expert {payload.language} developer. Generate complete, "
        f"working code with functions, comments, error handling, and an example "
        f"of input/output. Return only code."
    )
    raw = ask_ai(system_prompt, payload.prompt, task="generate")
    code = strip_code_fences(raw)

    db.add(Project(title=payload.prompt[:100], language=payload.language, code=code))
    _log(db, "generate", payload.prompt)
    return CodeResponse(result=code)


@router.post("/explain-code", response_model=CodeResponse)
def explain_code(payload: CodeOnlyRequest, db: Session = Depends(get_db)):
    system_prompt = (
        "Explain the given code line by line: variables, functions, loops, "
        "conditions, time complexity, and memory usage. Be concise but complete."
    )
    result = ask_ai(system_prompt, payload.code, task="explain")
    _log(db, "explain", payload.code)
    return CodeResponse(result=result)


@router.post("/debug-code", response_model=CodeResponse)
def debug_code(payload: CodeOnlyRequest, db: Session = Depends(get_db)):
    system_prompt = (
        "Act as a code debugger. Detect syntax errors, runtime issues, logic "
        "mistakes, and security problems. List the problematic lines, then "
        "provide corrected code."
    )
    result = ask_ai(system_prompt, payload.code, task="debug")
    _log(db, "debug", payload.code)
    return CodeResponse(result=result)


@router.post("/optimize-code", response_model=CodeResponse)
def optimize_code(payload: CodeOnlyRequest, db: Session = Depends(get_db)):
    system_prompt = (
        "Optimize the given code for speed, readability, memory, and naming "
        "conventions. Show the code before, the code after, and a short "
        "explanation of why it improved."
    )
    result = ask_ai(system_prompt, payload.code, task="optimize")
    _log(db, "optimize", payload.code)
    return CodeResponse(result=result)


@router.post("/complexity", response_model=CodeResponse)
def complexity(payload: CodeOnlyRequest, db: Session = Depends(get_db)):
    system_prompt = (
        "Analyze the given code and report its Time Complexity and Space "
        "Complexity using Big-O notation, with a short explanation of how you "
        "derived each one."
    )
    result = ask_ai(system_prompt, payload.code, task="complexity")
    _log(db, "complexity", payload.code)
    return CodeResponse(result=result)


@router.post("/convert-code", response_model=CodeResponse)
def convert_code(payload: ConvertRequest, db: Session = Depends(get_db)):
    system_prompt = (
        f"Convert the given {payload.source_language} code into equivalent, "
        f"idiomatic {payload.target_language} code. Preserve behavior. Return "
        f"only code."
    )
    raw = ask_ai(system_prompt, payload.code, task="convert")
    result = strip_code_fences(raw)
    _log(db, "convert", f"{payload.source_language}->{payload.target_language}")
    return CodeResponse(result=result)


@router.post("/generate-docs", response_model=CodeResponse)
def generate_docs(payload: CodeOnlyRequest, db: Session = Depends(get_db)):
    system_prompt = (
        "Generate documentation for the given code: function docstrings, a "
        "project README section, and inline comments where useful."
    )
    result = ask_ai(system_prompt, payload.code, task="docs")
    _log(db, "docs", payload.code)
    return CodeResponse(result=result)


@router.post("/security-scan", response_model=CodeResponse)
def security_scan(payload: CodeOnlyRequest, db: Session = Depends(get_db)):
    system_prompt = (
        "Scan the given code for security issues: SQL injection, XSS, hardcoded "
        "passwords, weak authentication, and unsafe file handling. List each "
        "issue found and suggest a secure alternative."
    )
    result = ask_ai(system_prompt, payload.code, task="security")
    _log(db, "security", payload.code)
    return CodeResponse(result=result)


@router.post("/generate-project", response_model=CodeResponse)
def generate_project(payload: GenerateRequest, db: Session = Depends(get_db)):
    system_prompt = (
        "Generate a complete project plan for the requested system: folder "
        "structure, backend outline, frontend outline, database schema, key "
        "API endpoints, and a short README with an installation guide."
    )
    result = ask_ai(system_prompt, payload.prompt, task="project")
    _log(db, "project", payload.prompt)
    return CodeResponse(result=result)
