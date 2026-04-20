"""
CalculationQuery.

Query to fetch and filter calculation requests.
"""

from beanie import PydanticObjectId
from beanie.odm.queries.find import FindMany

from api.models.calcul import CalculationRequest
from api.models.enums import WorkerCategory

from ._base import Query


class CalculationQuery(Query[CalculationRequest]):
    """Fetch and filter calculation requests."""

    async def get_qs(self) -> FindMany[CalculationRequest]:
        """Instantiate a new query object to avoid cache pollution."""
        qs: FindMany[CalculationRequest] = CalculationRequest.find()

        # Filter by employee name
        if filter_employee_name := self.filters.get("employee_name"):
            qs = qs.find(CalculationRequest.employee_name == filter_employee_name)

        # Filter by employee email
        if filter_employee_email := self.filters.get("employee_email"):
            qs = qs.find(CalculationRequest.employee_email == filter_employee_email)

        # Filter by employee id
        if filter_employee_id := self.filters.get("employee_id"):
            qs = qs.find(CalculationRequest.employee_id == filter_employee_id)

        # Filter by category
        if filter_category := self.filters.get("category"):
            try:
                category = WorkerCategory(filter_category)
                qs = qs.find(CalculationRequest.category == category)
            except ValueError:
                pass

        # Filter by status
        if filter_status := self.filters.get("status"):
            qs = qs.find(CalculationRequest.status == filter_status)

        # Filter by contract type
        if filter_contract := self.filters.get("contract_type"):
            qs = qs.find(CalculationRequest.contract_type == filter_contract)

        # Filter by user (calculations created by specific user)
        if self.user and self.user.id:
            user_id = PydanticObjectId(str(self.user.id))
            qs = qs.find(CalculationRequest.user_id == user_id)

        return qs

    async def get_search(self, search_text: str) -> FindMany[CalculationRequest]:
        """Apply a search for initial queryset."""
        qs = self.get_qs()
        return (
            await qs
        ).find(
            {
                "$text": {
                    "$search": search_text,
                }
            },
            limit=50,
        )
