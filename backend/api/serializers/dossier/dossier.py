from datetime import datetime
from typing import Any, List, Optional

from beanie import PydanticObjectId
from pydantic import Field

from sap.fastapi import ObjectSerializer, WriteObjectSerializer

from api.models.dossier._embedded import DisputeDetails, WorkHistory
from api.models.dossier.dossier import Dossier
from api.serializers.calcul.calcul import CalculationSerializer


class WorkHistorySerializer(ObjectSerializer[WorkHistory]):
    employer: str
    position: str
    start_date: datetime
    end_date: Optional[datetime] = None
    salary: float


class DisputeDetailsSerializer(ObjectSerializer[DisputeDetails]):
    nature: str
    description: str
    demands: List[str]


class DossierSerializer(ObjectSerializer[Dossier]):
    id: PydanticObjectId
    title: str
    description: Optional[str] = None
    status: str
    user_id: PydanticObjectId
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    work_history: List[WorkHistorySerializer]
    dispute_details: Optional[DisputeDetailsSerializer] = None
    calculation_requests: List[CalculationSerializer] = Field(default_factory=list)
    created: datetime
    updated: datetime

    @classmethod
    def read(cls, instance: Dossier, exclude: set[str] | None = None) -> "DossierSerializer":
        """Read the dossier from the model, including calculation requests."""
        import logging
        logger = logging.getLogger(__name__)
        res = super().read(instance, exclude=exclude)
        calcs = cls.get_calculation_requests(instance)
        logger.error(f"SERIALIZER DEBUG: Fetched {len(calcs)} calculations for dossier {instance.id}")
        res.calculation_requests = calcs
        return res

    @classmethod
    def get_calculation_requests(cls, instance: Dossier) -> List[CalculationSerializer]:
        """Filter out unfetched calculation requests and handle prefetched links."""
        from sap.beanie import Link
        
        res = []
        if not instance.calculation_requests:
            return res

        for req in instance.calculation_requests:
            # If it's a Link object, check if it has been prefetched
            if isinstance(req, Link):
                if hasattr(req, "doc") and req.doc:
                    res.append(CalculationSerializer.read(req.doc, include_results=True))
                continue
                
            # If it's already a CalculationRequest object
            if type(req).__name__ == "CalculationRequest":
                res.append(CalculationSerializer.read(req, include_results=True))
                continue
                
            # Fallback for already serialized dicts
            if isinstance(req, dict) and "employee_name" in req:
                res.append(req)
        return res


class WriteDossierSerializer(WriteObjectSerializer[Dossier]):
    title: str
    description: Optional[str] = None
    status: str = "ouvert"
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    work_history: List[dict] = Field(default_factory=list)
    dispute_details: Optional[dict] = None
    calculation_requests: List[str] = Field(default_factory=list)

    async def create(self, **kwargs: Any) -> Dossier:
        request_user = kwargs.get("request_user")
        from sap.beanie.link import DBRef, Link
        from api.models.calcul import CalculationRequest

        instance = Dossier(
            title=self.title,
            description=self.description,
            status=self.status,
            user_id=request_user.id if request_user else None,
            client_name=self.client_name,
            client_email=self.client_email,
            client_phone=self.client_phone,
            work_history=[WorkHistory(**wh) for wh in self.work_history],
            dispute_details=DisputeDetails(**self.dispute_details) if self.dispute_details else None,
            calculation_requests=[
                Link(ref=DBRef(collection="calculation_request", id=PydanticObjectId(cid)), document_class=CalculationRequest)
                for cid in self.calculation_requests
            ],
        )
        await instance.insert()
        return instance

    async def update(self, **kwargs: Any) -> Dossier:
        assert self.instance
        from sap.beanie.link import DBRef, Link
        from api.models.calcul import CalculationRequest

        self.instance.title = self.title
        self.instance.description = self.description
        self.instance.status = self.status
        self.instance.client_name = self.client_name
        self.instance.client_email = self.client_email
        self.instance.client_phone = self.client_phone
        self.instance.work_history = [WorkHistory(**wh) for wh in self.work_history]
        self.instance.dispute_details = DisputeDetails(**self.dispute_details) if self.dispute_details else None
        
        # Explicitly convert IDs to Link objects to ensure they are saved in MongoDB
        self.instance.calculation_requests = [
            Link(ref=DBRef(collection="calculation_request", id=PydanticObjectId(cid)), document_class=CalculationRequest)
            for cid in self.calculation_requests
        ]
        
        await self.instance.save()
        return self.instance
