from datetime import datetime
from typing import Any, List, Optional

from pydantic import Field
from beanie import PydanticObjectId

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
    created_at: datetime
    updated_at: datetime


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
            calculation_requests=self.calculation_requests,
        )
        await instance.insert()
        return instance

    async def update(self, **kwargs: Any) -> Dossier:
        assert self.instance
        self.instance.title = self.title
        self.instance.description = self.description
        self.instance.status = self.status
        self.instance.client_name = self.client_name
        self.instance.client_email = self.client_email
        self.instance.client_phone = self.client_phone
        self.instance.work_history = [WorkHistory(**wh) for wh in self.work_history]
        self.instance.dispute_details = DisputeDetails(**self.dispute_details) if self.dispute_details else None
        self.instance.calculation_requests = self.calculation_requests
        self.instance.updated_at = datetime.utcnow()
        await self.instance.save()
        return self.instance
