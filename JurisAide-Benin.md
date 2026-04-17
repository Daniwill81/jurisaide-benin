# JurisAide Bénin

## Elevator pitch
JurisAide is a high-precision legal engine combining a deterministic calculation core with a QLoRA fine-tuned model on Beninese labor law. It provides an API-first infrastructure for automated indemnity audits, case-similarity mapping, and verifiable legal document generation.

## Problem
General AI (ChatGPT) hallucinates math and local legal procedures, leading to "stochastic errors" in labor disputes. There is no structured, unit-tested engine for Beninese Labor Code (Loi 98-004) that guarantees 100% mathematical accuracy and cites verified local jurisprudence at scale.

## Target audience
B2B: HR software providers and Payroll firms needing a compliance API.

Legal Clinics & Unions: Looking for a Case Similarity Engine to defend workers.

SME Managers: Requiring a "Zero-Error" calculator for severance, notice periods, and leave to avoid lawsuits.

## Category
Productivity / Automation

## Core features
- The Deterministic Calculator (The Backend Moat): A Python-based engine that implements the exact logic of the Beninese Labor Code (Loi 98-004) and its application decrees. It is not an AI that "guesses"; it is a hardcoded, unit-tested legal logic.
- Fine-Tuned Domain Adapter (QLoRA): A Llama-3 or Mistral model fine-tuned on a curated corpus of Beninese legal documents (Official Journals, court decisions) to classify disputes and summarize relevant jurisprudence without hallucinations.
- Hybrid RAG (Retrieval-Augmented Generation): An indexing system using a Vector Database (like Pinecone or Weaviate) to link every calculation to the exact paragraph of the Beninese Law. - Case Similarity Engine: Uses embeddings to find historical labor disputes similar to the user's situation and estimate the "Confidence Level" of a favorable outcome.
- Case Similarity Engine: Uses embeddings to find historical labor disputes similar to the user's situation and estimate the "Confidence Level" of a favorable outcome.

## Secondary features
- Case Outcome Predictor: Using historical Beninese labor court data to provide a "Probability of Success" score for mediation.
- Legal OCR Pipeline: An automated system to digitize, clean, and index physical PDF scans of the Journal Officiel du Bénin.

## Primary user journey
Data Ingestion: The user (or an API) sends a work history and a dispute description.

Classification: The fine-tuned model identifies the legal issue (e.g., Rupture abusive).

Execution: The Deterministic Engine calculates the "Indemnités" with 100% accuracy.

Search: The RAG system retrieves 3 similar past cases in Benin.

Audit Trail: The system outputs a JSON response with the calculation, citations, and a confidence score for a mediation request.

## Competitors
- **LegiBenin** (local)
- **ChatGPT/Claude** (global)
- **Sira** (local)

## Competitive edge
Deterministic Integrity: We separate the Logic (Hardcoded Python formulas for Art. 44) from the Language (LLM for explanation). No math hallucinations.

Domain Adaptation (QLoRA): Unlike generic AI, our model is fine-tuned specifically on the Beninese Labor Code corpus, recognizing local legal nuances.

Data Sovereignty: Our "Local-First" architecture allows deployment on private infrastructure, ensuring sensitive legal data never leaves the country.

## Design inspiration
- TurboTax/TaxFix
