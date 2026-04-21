"""
UserQuery.

Query to fetch some key statistics to display in the interface on User.
"""

from beanie.odm.queries.find import FindMany

from api.models import User

from ._base import Query


class UserQuery(Query[User]):
    """Fetch some key statistics to display in the interface."""

    def get_qs(self) -> FindMany[User]:
        """Instantiate a new query object to avoid cache pollution."""
        qs: FindMany[User] = User.find()

        # Filter by first name
        if filter_first_name := self.filters.get("first_name"):
            qs = qs.find(User.first_name == filter_first_name)

        # Filter by last name
        if filter_last_name := self.filters.get("last_name"):
            qs = qs.find(User.last_name == filter_last_name)

        # Filter by email
        if filter_email := self.filters.get("email"):
            qs = qs.find(User.email == filter_email)

        # Filter by is_active
        if filter_is_active := self.filters.get("is_active"):
            if filter_is_active == "is_active_true":
                qs = qs.find(User.is_active == True)
            elif filter_is_active == "is_active_false":
                qs = qs.find(User.is_active == False)

        return qs
