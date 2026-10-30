import pytest
import asyncio
from backend.app.config import Settings
from backend.app.services.ai_service import MultiModelEnsembleAIService, MockAIService


def test_comma_separated_model_parsing():
    settings = Settings(
        GEMINI_MODEL="gemini-3.8-flash, gemini-3.5-flash, gemini-3.1-flash-lite",
        OPENAI_MODEL="gpt-4o-mini, gpt-4o, o3-mini"
    )
    assert settings.get_gemini_models() == ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"]
    assert settings.get_openai_models() == ["gpt-4o-mini", "gpt-4o", "o3-mini"]


def test_model_parsing_with_single_model():
    settings = Settings(
        GEMINI_MODEL="gemini-3.5-flash",
        OPENAI_MODEL="gpt-4o"
    )
    assert settings.get_gemini_models() == ["gemini-3.5-flash"]
    assert settings.get_openai_models() == ["gpt-4o"]


@pytest.mark.anyio
async def test_ensemble_planning():
    s1 = MockAIService(model_name="mock-model-1")
    s2 = MockAIService(model_name="mock-model-2")
    ensemble = MultiModelEnsembleAIService(runners=[{"name": "m1", "service": s1}, {"name": "m2", "service": s2}])
    
    plan = await ensemble.generate_plan("Quantum Computing algorithms", "deep instructions", "deep")
    assert plan is not None
    assert "research_questions" in plan
    assert len(plan["research_questions"]) > 0


@pytest.mark.anyio
async def test_ensemble_source_analysis_mixing():
    s1 = MockAIService(model_name="mock-1")
    s2 = MockAIService(model_name="mock-2")
    ensemble = MultiModelEnsembleAIService(runners=[{"name": "m1", "service": s1}, {"name": "m2", "service": s2}])
    
    sources = [
        {
            "id": "1",
            "title": "Qubit Stability",
            "url": "https://quantum.org/paper",
            "domain": "quantum.org",
            "snippet": "Topological qubits show 99.9% fidelity.",
            "extracted_content": "High fidelity topological qubits tested."
        }
    ]
    analysis = await ensemble.analyze_sources("Quantum Computing", ["What is qubit fidelity?"], sources)
    assert analysis is not None
    assert "key_findings" in analysis
    assert len(analysis["key_findings"]) > 0
    assert "models_utilized" in analysis
    assert len(analysis["models_utilized"]) == 2


@pytest.mark.anyio
async def test_ensemble_report_generation():
    s1 = MockAIService(model_name="mock-1")
    ensemble = MultiModelEnsembleAIService(runners=[{"name": "m1", "service": s1}])
    
    plan = {
        "objective": "Understand Quantum computing",
        "research_questions": [{"question": "Qubit fidelity?"}]
    }
    analysis = {
        "key_findings": ["Finding 1: High coherence", "Finding 2: Error suppression"],
        "conflicting_claims": [],
        "confidence_assessment": "High confidence across sources"
    }
    sources = [
        {"title": "Paper 1", "url": "https://example.com/p1", "domain": "example.com", "snippet": "Test"}
    ]
    report = await ensemble.generate_report("Quantum Computing", "Standard instructions", plan, sources, analysis)
    assert "Executive Summary" in report
    assert "Key Findings" in report
