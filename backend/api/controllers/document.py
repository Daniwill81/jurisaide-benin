"""
Document Controller.

Generates legal PDFs (lettre de licenciement, reçu d'indemnités) using fpdf2,
then uploads them to MinIO and stores the metadata in MongoDB.
"""

import logging
from datetime import datetime
from io import BytesIO

from beanie import PydanticObjectId
from fpdf import FPDF

from api.models.document.document_genere import DocumentGenere
from api.models.dossier.dossier import Dossier
from api.models.calcul import CalculationRequest
from api.xlib.s3 import minio_client

logger = logging.getLogger(__name__)

# ─── Supported document types ─────────────────────────────────────────────────

DOCUMENT_TYPES = {
    "lettre_licenciement": "Lettre de Licenciement",
    "recu_indemnites": "Reçu de Règlement des Indemnités de Fin de Contrat",
}


# ─── PDF helpers ──────────────────────────────────────────────────────────────


def _fmt(value: float | None) -> str:
    """Format a monetary value or return 'N/A'."""
    if value is None:
        return "N/A"
    return f"{value:,.0f} XOF".replace(",", " ")


class _JurisAidePDF(FPDF):
    """Custom FPDF subclass with a branded header and footer."""

    def header(self) -> None:
        # Thin accent bar
        self.set_fill_color(67, 56, 202)  # indigo-700
        self.rect(0, 0, 210, 4, "F")

        self.set_y(10)
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(67, 56, 202)
        self.cell(0, 8, "JurisAide Bénin", align="L")
        self.set_font("Helvetica", "", 8)
        self.set_text_color(100, 100, 100)
        self.set_xy(10, 18)
        self.cell(0, 5, "Plateforme d'Intelligence Juridique — Droit du Travail", align="L")

        # Separator line
        self.set_draw_color(220, 220, 230)
        self.line(10, 25, 200, 25)
        self.ln(18)

    def footer(self) -> None:
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Page {self.page_no()} — Généré le {datetime.now().strftime('%d/%m/%Y')}", align="C")


def _section_title(pdf: _JurisAidePDF, title: str) -> None:
    """Render a styled section heading."""
    pdf.set_fill_color(240, 240, 255)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(67, 56, 202)
    pdf.cell(0, 8, f"  {title}", fill=True, ln=True)
    pdf.ln(3)
    pdf.set_text_color(30, 30, 30)


def _info_row(pdf: _JurisAidePDF, label: str, value: str) -> None:
    """Render a label/value row."""
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(100, 100, 120)
    pdf.cell(60, 6, label.upper(), ln=False)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 6, value or "—", ln=True)


# ─── Lettre de licenciement ───────────────────────────────────────────────────


def _generate_lettre_licenciement(dossier: Dossier, calc: CalculationRequest | None) -> bytes:
    """Build a lettre de licenciement PDF and return raw bytes."""
    pdf = _JurisAidePDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)

    # ── Date and city ──
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 6, f"Cotonou, le {datetime.now().strftime('%d %B %Y')}", align="R", ln=True)
    pdf.ln(5)

    # ── Title ──
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(20, 20, 20)
    pdf.cell(0, 10, "LETTRE DE LICENCIEMENT", align="C", ln=True)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(0, 6, "Conformément à la Loi n° 98-004 du 27 janvier 1998 (Code du Travail du Bénin)", align="C", ln=True)
    pdf.ln(8)

    # ── Client info ──
    _section_title(pdf, "Informations de l'Employé")
    _info_row(pdf, "Nom complet", dossier.client_name or "Non renseigné")
    _info_row(pdf, "Email", dossier.client_email or "—")
    _info_row(pdf, "Téléphone", dossier.client_phone or "—")
    pdf.ln(4)

    # ── Dossier info ──
    _section_title(pdf, "Informations du Dossier")
    _info_row(pdf, "Référence dossier", str(dossier.id))
    _info_row(pdf, "Titre", dossier.title)
    _info_row(pdf, "Classification", dossier.classification or "Non classifié")
    pdf.ln(4)

    # ── Dispute details ──
    if dossier.dispute_details:
        _section_title(pdf, "Motif du Licenciement")
        _info_row(pdf, "Nature", dossier.dispute_details.nature)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(40, 40, 40)
        pdf.multi_cell(0, 6, dossier.dispute_details.description or "")
        pdf.ln(4)

    # ── Body letter ──
    _section_title(pdf, "Corps de la Lettre")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(30, 30, 30)
    name = dossier.client_name or "Monsieur/Madame"
    letter_body = (
        f"Monsieur/Madame {name},\n\n"
        "Par la présente, nous vous informons de la décision de mettre fin à votre contrat de "
        "travail pour le motif exposé ci-dessus, conformément aux dispositions du Code du Travail "
        "de la République du Bénin (Loi n° 98-004 du 27 janvier 1998).\n\n"
        "Vous serez informé(e) des modalités de votre préavis et du règlement de vos indemnités "
        "de rupture conformément aux articles applicables dudit code.\n\n"
        "Nous vous prions de prendre acte de la présente décision et de vous rapprocher du service "
        "des ressources humaines pour toute formalité complémentaire.\n\n"
        "Veuillez agréer, Monsieur/Madame, l'expression de nos salutations distinguées."
    )
    pdf.multi_cell(0, 6, letter_body)
    pdf.ln(12)

    # ── Signature ──
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, "L'Employeur", align="R", ln=True)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(0, 6, "(Signature et cachet)", align="R", ln=True)

    # ── Legal reference ──
    pdf.ln(10)
    pdf.set_fill_color(245, 245, 255)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(100, 100, 140)
    pdf.multi_cell(
        0, 5,
        "Document généré automatiquement par JurisAide Bénin. Références légales : "
        "Art. 43–45 (indemnité de licenciement), Art. 53 (préavis), Loi n° 98-004 du 27 janvier 1998.",
        fill=True,
    )

    return bytes(pdf.output())


# ─── Reçu d'indemnités ────────────────────────────────────────────────────────


def _generate_recu_indemnites(dossier: Dossier, calc: CalculationRequest | None) -> bytes:
    """Build a reçu d'indemnités de fin de contrat PDF."""
    pdf = _JurisAidePDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)

    # ── Title ──
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(20, 20, 20)
    pdf.cell(0, 10, "REÇU DE RÈGLEMENT", align="C", ln=True)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 7, "Indemnités de Fin de Contrat de Travail", align="C", ln=True)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(0, 6, f"Date : {datetime.now().strftime('%d/%m/%Y')}", align="C", ln=True)
    pdf.ln(8)

    # ── Client info ──
    _section_title(pdf, "Informations de l'Employé")
    _info_row(pdf, "Nom complet", dossier.client_name or "Non renseigné")
    _info_row(pdf, "Email", dossier.client_email or "—")
    _info_row(pdf, "Téléphone", dossier.client_phone or "—")
    pdf.ln(4)

    # ── Work history ──
    if dossier.work_history:
        wh = dossier.work_history[0]
        _section_title(pdf, "Historique de Travail")
        _info_row(pdf, "Employeur", wh.employer)
        _info_row(pdf, "Poste", wh.position)
        _info_row(pdf, "Date d'entrée", wh.start_date.strftime("%d/%m/%Y") if wh.start_date else "—")
        _info_row(pdf, "Date de sortie", wh.end_date.strftime("%d/%m/%Y") if wh.end_date else "—")
        _info_row(pdf, "Salaire moyen", f"{wh.salary:,.0f} XOF".replace(",", " ") if wh.salary else "—")
        pdf.ln(4)

    # ── Calculation results ──
    _section_title(pdf, "Détail des Indemnités Calculées")
    if calc:
        _info_row(pdf, "Ancienneté", f"{calc.seniority_years or '—'} an(s)")
        _info_row(pdf, "Indemnité de licenciement", _fmt(calc.severance_pay))
        _info_row(pdf, "Indemnité de préavis", _fmt(calc.notice_period_pay))
        _info_row(pdf, "Indemnité de congés payés", _fmt(calc.leave_pay))
        pdf.ln(3)

        # Total box
        pdf.set_fill_color(67, 56, 202)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 10, f"  TOTAL NET À PAYER : {_fmt(calc.total)}", fill=True, ln=True)
        pdf.set_text_color(30, 30, 30)
    else:
        pdf.set_font("Helvetica", "I", 9)
        pdf.set_text_color(120, 120, 120)
        pdf.cell(0, 7, "Aucun calcul associé à ce dossier.", ln=True)
    pdf.ln(6)

    # ── Signature block ──
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(40, 40, 40)
    pdf.cell(95, 6, "L'Employeur", align="C")
    pdf.cell(0, 6, "L'Employé(e)", align="C", ln=True)
    pdf.cell(95, 6, "(Signature et cachet)", align="C")
    pdf.cell(0, 6, "(Signature)", align="C", ln=True)
    pdf.ln(8)

    # ── Legal footer ──
    pdf.set_fill_color(245, 245, 255)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(100, 100, 140)
    pdf.multi_cell(
        0, 5,
        "Document généré automatiquement par JurisAide Bénin. Références légales : "
        "Art. 43–45 (indemnité de licenciement), Art. 53 (préavis), Art. 113 (congés payés), "
        "Loi n° 98-004 du 27 janvier 1998.",
        fill=True,
    )

    return bytes(pdf.output())


# ─── Dispatcher ───────────────────────────────────────────────────────────────


GENERATORS = {
    "lettre_licenciement": _generate_lettre_licenciement,
    "recu_indemnites": _generate_recu_indemnites,
}


async def generate_document(
    dossier_id: str,
    document_type: str,
    user_id: PydanticObjectId,
) -> DocumentGenere:
    """
    Generate a legal PDF, upload it to MinIO, persist metadata to MongoDB.

    Args:
        dossier_id:    MongoDB ID of the Dossier.
        document_type: One of 'lettre_licenciement' | 'recu_indemnites'.
        user_id:       The requesting user's ID.

    Returns:
        The saved DocumentGenere instance.

    Raises:
        ValueError: For unknown document_type or dossier not found.
    """
    if document_type not in GENERATORS:
        raise ValueError(f"Unknown document_type '{document_type}'. Allowed: {list(GENERATORS)}")

    # ── Load dossier ──
    dossier = await Dossier.find_one(
        Dossier.id == PydanticObjectId(dossier_id),
        Dossier.user_id == user_id,
        fetch_links=True,
    )
    if not dossier:
        raise ValueError(f"Dossier {dossier_id} not found for user {user_id}")

    await dossier.fetch_all_links()

    # ── Resolve latest calculation (if any) ──
    calc: CalculationRequest | None = None
    if dossier.calculation_requests:
        first = dossier.calculation_requests[0]
        if isinstance(first, CalculationRequest):
            calc = first
        elif hasattr(first, "doc") and first.doc:
            calc = first.doc

    # ── Generate PDF bytes ──
    logger.info(f"Generating '{document_type}' for dossier {dossier_id}")
    pdf_bytes = GENERATORS[document_type](dossier, calc)

    # ── Upload to MinIO ──
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    minio_key = f"documents/{user_id}/{dossier_id}/{document_type}_{ts}.pdf"
    url = await minio_client.upload_pdf(minio_key, pdf_bytes)

    # ── Persist to MongoDB ──
    doc = DocumentGenere(
        user_id=user_id,
        dossier_id=PydanticObjectId(dossier_id),
        document_type=document_type,
        title=f"{DOCUMENT_TYPES[document_type]} — {dossier.title}",
        minio_key=minio_key,
        download_url=url,
    )
    await doc.insert()
    logger.info(f"DocumentGenere saved: {doc.id} → {url}")
    return doc


async def list_documents(user_id: PydanticObjectId, dossier_id: str | None = None) -> list[DocumentGenere]:
    """
    List all documents generated by a user, optionally filtered by dossier.
    """
    query = DocumentGenere.find(DocumentGenere.user_id == user_id)
    if dossier_id:
        query = query.find(DocumentGenere.dossier_id == PydanticObjectId(dossier_id))
    return await query.sort(-DocumentGenere.generated_at).to_list()


async def get_download_url(document_id: str, user_id: PydanticObjectId) -> str:
    """
    Return a fresh pre-signed MinIO URL for the document (valid 1 hour).
    """
    doc = await DocumentGenere.find_one(
        DocumentGenere.id == PydanticObjectId(document_id),
        DocumentGenere.user_id == user_id,
    )
    if not doc:
        raise ValueError(f"Document {document_id} not found")
    url = await minio_client.generate_presigned_url(doc.minio_key, expires_in=3600)
    return url
