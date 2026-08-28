import pytest
from django.test import Client
from strawberry.django.test import GraphQLTestClient


@pytest.fixture
def gql_client(client: Client) -> GraphQLTestClient:
    """Strawberry's test client wrapping Django's test client."""
    return GraphQLTestClient(client, url="/api/v1/")
