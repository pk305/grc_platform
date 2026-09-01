"""Voice/video calls via Microsoft Graph's `onlineMeetings` API.

Creates a Teams meeting and hands back its join link, rather than this app
running its own signaling/media infrastructure. Requires an Azure app
registration with the `OnlineMeetings.ReadWrite.All` application permission
(admin consent granted) — see `.env.example` for the three settings this
needs. Until they're set, `create_online_meeting` raises `CallsNotConfigured`
before making any network call, so wiring up real credentials later is a
config change, not a code change.
"""

import httpx
from django.conf import settings

TOKEN_URL = "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"
GRAPH_SCOPE = "https://graph.microsoft.com/.default"
ONLINE_MEETINGS_URL = "https://graph.microsoft.com/v1.0/users/{organizer}/onlineMeetings"

REQUEST_TIMEOUT = 10.0


class CallsNotConfigured(Exception):
    """Raised when the Microsoft Graph credentials haven't been set up yet."""


def _graph_credentials() -> tuple[str, str, str]:
    tenant = settings.MS_GRAPH_TENANT_ID
    client_id = settings.MS_GRAPH_CLIENT_ID
    client_secret = settings.MS_GRAPH_CLIENT_SECRET
    if not (tenant and client_id and client_secret):
        raise CallsNotConfigured(
            "MS_GRAPH_TENANT_ID, MS_GRAPH_CLIENT_ID and MS_GRAPH_CLIENT_SECRET must all be set."
        )
    return tenant, client_id, client_secret


def _access_token(tenant: str, client_id: str, client_secret: str) -> str:
    response = httpx.post(
        TOKEN_URL.format(tenant=tenant),
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "scope": GRAPH_SCOPE,
            "grant_type": "client_credentials",
        },
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response.json()["access_token"]


def create_online_meeting(organizer_email: str, subject: str) -> str:
    """Create a Teams meeting organised by `organizer_email` and return its
    join URL.

    Raises `CallsNotConfigured` if the Graph credentials are unset, or
    `httpx.HTTPStatusError` if Graph itself rejects the request (e.g. missing
    admin consent, or `organizer_email` isn't a Graph-known user).
    """
    tenant, client_id, client_secret = _graph_credentials()
    token = _access_token(tenant, client_id, client_secret)

    response = httpx.post(
        ONLINE_MEETINGS_URL.format(organizer=organizer_email),
        headers={"Authorization": f"Bearer {token}"},
        json={"subject": subject},
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response.json()["joinWebUrl"]
