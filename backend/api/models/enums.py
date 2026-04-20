import enum


class RoleEnum(str, enum.Enum):
    """List of roles available for users.

    Each role has different access and set of permissions.
    """

    ADMIN = "ADMIN"  # Super administrator
    PUSER = "PUSER"  # Platform user
    ANONYMOUS = "ANONYMOUS"  # Unidentified user


class SexEnum(str, enum.Enum):
    """The sex of the person."""

    M = "M"  # Male
    F = "F"  # Female


class WorkerCategory(str, enum.Enum):
    OUVRIER = "ouvrier"
    EMPLOYE = "employe"
    AGENT_MAITRISE = "agent_maitrise"
    CADRE = "cadre"


class ContractType(str, enum.Enum):
    CDI = "cdi"
    CDD = "cdd"


class TerminationReason(str, enum.Enum):
    LICENCIEMENT = "licenciement"
    DEMISSION = "demission"
    RUPTURE_NEGOCIEE = "rupture_negociee"
    FIN_CONTRAT = "fin_contrat"
