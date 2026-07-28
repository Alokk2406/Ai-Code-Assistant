"""
AI provider abstraction layer.

This module is intentionally provider-agnostic: every route handler calls
``ask_ai(system_prompt, user_prompt)`` and never talks to a specific vendor
SDK directly. That makes it a one-file change to switch providers or add a
new one.

STATUS: stubbed. No live API calls are made until you:
  1. `pip install google-generativeai openai` (see requirements.txt)
  2. Set one of GEMINI_API_KEY / OPENAI_API_KEY / OLLAMA_HOST in your
     environment (or a .env file)
  3. Flip USE_MOCK below to False, or just leave it -- ask_ai() already
     auto-detects a configured provider and only falls back to the mock
     when none is found.

The mock responses are realistic placeholders so the frontend and API
contract can be built/tested end-to-end before any API key exists.
"""
import os
import textwrap

PROVIDER = os.getenv("AI_PROVIDER", "auto")  # "gemini" | "openai" | "ollama" | "auto"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OLLAMA_HOST = os.getenv("OLLAMA_HOST")  # e.g. http://localhost:11434
USE_MOCK = os.getenv("AI_USE_MOCK", "auto")  # "true" | "false" | "auto"


def _provider_available() -> str | None:
    if PROVIDER != "auto":
        return PROVIDER
    if GEMINI_API_KEY:
        return "gemini"
    if OPENAI_API_KEY:
        return "openai"
    if OLLAMA_HOST:
        return "ollama"
    return None


def _call_gemini(system_prompt: str, user_prompt: str) -> str:
    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(
        model_name=os.getenv("GEMINI_MODEL", "gemini-1.5-pro"),
        system_instruction=system_prompt,
    )
    result = model.generate_content(user_prompt)
    return result.text


def _call_openai(system_prompt: str, user_prompt: str) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=OPENAI_API_KEY)
    completion = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    return completion.choices[0].message.content


def _call_ollama(system_prompt: str, user_prompt: str) -> str:
    import requests

    resp = requests.post(
        f"{OLLAMA_HOST}/api/generate",
        json={
            "model": os.getenv("OLLAMA_MODEL", "codellama"),
            "prompt": f"{system_prompt}\n\n{user_prompt}",
            "stream": False,
        },
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json().get("response", "")


def _mock_response(task: str, user_prompt: str) -> str:
    """Deterministic, readable placeholder so the UI has something to render."""
    snippets = {
        "chat": f"Here's an explanation related to: {user_prompt[:120]}\n\n"
                f"(Mock response — connect an AI provider in services/ai_service.py "
                f"to get real answers.)",
        "generate": textwrap.dedent(f'''\
            # Mock generated code for prompt: {user_prompt[:80]}
            def main():
                """Placeholder implementation. Connect an AI provider for real output."""
                print("Hello from the AI Code Assistant scaffold!")

            if __name__ == "__main__":
                main()
        '''),
        "explain": f"Line-by-line explanation placeholder for the submitted code. "
                   f"Connect an AI provider to receive a real breakdown.",
        "debug": "No live model connected yet -- mock debugger output:\n"
                 "- [line 1] Placeholder: no syntax issues detected.\n"
                 "- Suggestion: connect a provider in ai_service.py for real analysis.",
        "optimize": "Mock optimization notes:\n- Placeholder suggestion: use list "
                    "comprehensions where applicable.\n- Connect a provider for real output.",
        "complexity": "Time Complexity: O(n) (placeholder)\nSpace Complexity: O(1) (placeholder)",
        "convert": "// Mock converted code placeholder.\n// Connect an AI provider for a real conversion.",
        "docs": "## Placeholder Documentation\nConnect an AI provider to generate real docs.",
        "security": "Mock security scan:\n- No provider connected -- placeholder result.\n"
                    "- 0 issues found (mock).",
        "project": "Mock project scaffold description. Connect an AI provider for a full "
                   "generated project (folders, backend, frontend, README).",
    }
    return snippets.get(task, "Mock AI response placeholder.")


def ask_ai(system_prompt: str, user_prompt: str, task: str = "chat") -> str:
    """
    Main entrypoint used by every route. Routes real requests to whichever
    provider is configured; otherwise returns a labeled mock response so the
    rest of the app is fully testable without any API key.
    """
    mock_forced = USE_MOCK == "true"
    provider = None if mock_forced else _provider_available()

    if provider is None:
        return _mock_response(task, user_prompt)

    try:
        if provider == "gemini":
            return _call_gemini(system_prompt, user_prompt)
        if provider == "openai":
            return _call_openai(system_prompt, user_prompt)
        if provider == "ollama":
            return _call_ollama(system_prompt, user_prompt)
    except Exception as exc:  # pragma: no cover - defensive fallback
        return f"[AI provider error, falling back to mock: {exc}]\n\n" + _mock_response(
            task, user_prompt
        )

    return _mock_response(task, user_prompt)
