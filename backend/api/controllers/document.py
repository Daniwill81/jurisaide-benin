import uuid
from datetime import datetime
from fpdf import FPDF
from api.models.document.document_genere import DocumentGenere
from api.models.calcul.indemnite import CalculationAudit
from api.models.dossier.dossier import Dossier
from api.models.user.user import User
from api.xlib.s3 import s3_upload
from AppMain.settings import AppSettings

class DocumentController:
    @staticmethod
    async def generate_dismissal_letter(user: User, dossier: Dossier, audit: CalculationAudit) -> DocumentGenere:
        """
        Génère une lettre de licenciement au format PDF.
        """
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", "B", 16)
        pdf.cell(0, 10, "LETTRE DE LICENCIEMENT", ln=True, align="C")
        pdf.ln(10)

        pdf.set_font("Arial", "", 12)
        pdf.cell(0, 10, f"Date: {datetime.now().strftime('%d/%m/%Y')}", ln=True, align="R")
        pdf.ln(5)

        pdf.set_font("Arial", "B", 12)
        pdf.cell(0, 10, "Objet : Notification de licenciement", ln=True)
        pdf.ln(5)

        pdf.set_font("Arial", "", 12)
        content = (
            f"Monsieur/Madame,\n\n"
            f"Nous vous informons par la présente de notre décision de procéder à votre licenciement. "
            f"Cette décision fait suite à {dossier.dispute_details.reason if dossier.dispute_details else 'un motif légal'}.\n\n"
            f"Votre contrat prendra fin le {audit.end_date.strftime('%d/%m/%Y')}.\n\n"
            f"Conformément à la législation en vigueur au Bénin (Loi 98-004), vous bénéficierez "
            f"d'un préavis de {audit.notice_period_pay} XOF (équivalent monétaire si non effectué).\n\n"
            f"Nous vous prions d'agréer, Monsieur/Madame, l'expression de nos salutations distinguées."
        )
        pdf.multi_cell(0, 10, content)

        pdf_bytes = pdf.output(dest='S')
        file_key = f"documents/{user.id}/{uuid.uuid4()}.pdf"
        url = await s3_upload(pdf_bytes, file_key, AppSettings.AWS_S3_BUCKET)

        doc = DocumentGenere(
            titre=f"Lettre de licenciement - {dossier.title}",
            type_document="lettre_licenciement",
            url_s3=url,
            user=user,
            dossier=dossier
        )
        await doc.insert()
        return doc

    @staticmethod
    async def generate_indemnity_receipt(user: User, dossier: Dossier, audit: CalculationAudit) -> DocumentGenere:
        """
        Génère un reçu d'indemnités au format PDF.
        """
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", "B", 16)
        pdf.cell(0, 10, "RECU POUR SOLDE DE TOUT COMPTE", ln=True, align="C")
        pdf.ln(10)

        pdf.set_font("Arial", "", 12)
        pdf.cell(0, 10, f"Dossier: {dossier.title}", ln=True)
        pdf.cell(0, 10, f"Date: {datetime.now().strftime('%d/%m/%Y')}", ln=True)
        pdf.ln(10)

        # Tableau des indemnités
        pdf.set_font("Arial", "B", 12)
        pdf.cell(100, 10, "Désignation", border=1)
        pdf.cell(0, 10, "Montant (XOF)", border=1, ln=True)

        pdf.set_font("Arial", "", 12)
        items = [
            ("Indemnité de licenciement", audit.severance_pay),
            ("Indemnité de préavis", audit.notice_period_pay),
            ("Indemnité de congés payés", audit.leave_pay),
        ]

        for label, amount in items:
            pdf.cell(100, 10, label, border=1)
            pdf.cell(0, 10, f"{amount:,.0f}", border=1, ln=True)

        pdf.set_font("Arial", "B", 12)
        pdf.cell(100, 10, "TOTAL GENERAL", border=1)
        pdf.cell(0, 10, f"{audit.total:,.0f}", border=1, ln=True)

        pdf.ln(20)
        pdf.cell(0, 10, "Signature du travailleur", ln=True, align="R")

        pdf_bytes = pdf.output(dest='S')
        file_key = f"documents/{user.id}/{uuid.uuid4()}.pdf"
        url = await s3_upload(pdf_bytes, file_key, AppSettings.AWS_S3_BUCKET)

        doc = DocumentGenere(
            titre=f"Reçu d'indemnités - {dossier.title}",
            type_document="recu_indemnite",
            url_s3=url,
            user=user,
            dossier=dossier
        )
        await doc.insert()
        return doc
