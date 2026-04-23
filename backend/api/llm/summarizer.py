import logging
from typing import List

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_mistralai import ChatMistralAI

from AppMain.settings import AppSettings

logger = logging.getLogger(__name__)


class JurisSummarizer:
    """
    Summarizes legal cases and jurisprudence.
    """

    def __init__(self):
        api_key = AppSettings.MISTRAL_API_KEY or AppSettings.OPENAI_API_KEY
        self.llm = ChatMistralAI(mistral_api_key=api_key, model="mistral-small-latest", temperature=0)

        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "Tu es un expert en droit béninois. Ta mission est de résumer une jurisprudence de manière concise et factuelle, sans inventer de détails (pas d'hallucination).",
                ),
                ("user", "Jurisprudence: {content}\n\nRésumé (maximum 150 mots):"),
            ]
        )

        self.chain = self.prompt | self.llm | StrOutputParser()

    async def summarize(self, content: str) -> str:
        """
        Summarize the given legal content.
        """
        try:
            if not content:
                return ""

            # If content is too long, we might need to truncate or chunk it
            # For now, we assume it fits in context (Mistral has large context)
            result = await self.chain.ainvoke({"content": content})
            return result.strip()
        except Exception as e:
            logger.error(f"Error summarizing jurisprudence: {str(e)}")
            return "Résumé indisponible."


summarizer = JurisSummarizer()
