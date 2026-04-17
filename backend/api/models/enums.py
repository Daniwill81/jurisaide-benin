from enum import Enum

class WorkerCategory(str, Enum):
    OUVRIER = "ouvrier"
    EMPLOYE = "employe"
    AGENT_MAITRISE = "agent_maitrise"
    CADRE = "cadre"

class ContractType(str, Enum):
    CDI = "cdi"
    CDD = "cdd"

class TerminationReason(str, Enum):
    LICENCIEMENT = "licenciement"
    DEMISSION = "demission"
    RUPTURE_NEGOCIEE = "rupture_negociee"
    FIN_CONTRAT = "fin_contrat"
