import typing

import beanie
from app.models import User
from app.xlib.utils import extract_filter_params
from beanie.odm.queries.find import FindMany
from fastapi.datastructures import QueryParams
from sap.beanie import prepare_search_string
from sap.beanie.document import DocT
from sap.beanie.exceptions import Object404Error


class Query(typing.Generic[DocT]):
    """Fetch some key statistics to display in the interface."""

    user: User  # The user that performed the query
    filters: dict[str, str | None]

    total: int = 0

    def __init__(
        self,
        user: User,
        filters: typing.Union[dict[str, str | None], QueryParams, None] = None,
    ) -> None:
        """Init with context."""
        self.user = user
        self.filters = extract_filter_params(filters or {})

    def get_qs(self) -> FindMany[DocT]:
        """Instantiate a new query object to avoid cache pollution."""
        raise NotImplementedError

    def get_search(self, search_text: str) -> FindMany[DocT]:
        """Apply a search for initial queryset."""
        return self.get_qs().find(
            {"$text": {"$search": prepare_search_string(search_text)}}, limit=50
        )

    async def retrieve(self, id_str: str) -> DocT:
        """Retrieve a specific object by id that also match the query."""
        qs = await self.get_qs()
        qs = qs.find({"_id": beanie.PydanticObjectId(id_str)})
        result = await qs.to_list()
        if not result:
            raise Object404Error
        return result[0]
