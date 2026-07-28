"""Small shared helpers used across route handlers."""
import re


def strip_code_fences(text: str) -> str:
    """Remove ```lang ... ``` fences an LLM might wrap code in."""
    text = text.strip()
    text = re.sub(r"^```[a-zA-Z0-9]*\n", "", text)
    text = re.sub(r"\n```$", "", text)
    return text.strip()


def guess_language(code: str) -> str:
    """Very rough language guess used when the client doesn't specify one."""
    signals = {
        "python": [" def ", "import ", "self.", "elif "],
        "javascript": ["function ", "const ", "let ", "=>"],
        "java": ["public class", "System.out", "void main"],
        "c": ["#include", "int main("],
        "go": ["func main", "package main"],
        "rust": ["fn main", "let mut"],
    }
    for lang, markers in signals.items():
        if any(m in code for m in markers):
            return lang
    return "plaintext"
