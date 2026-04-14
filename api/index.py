from backend.main import app as backend_app


class PrefixStrippingASGI:
    def __init__(self, app, prefix: str = "/api"):
        self.app = app
        self.prefix = prefix

    async def __call__(self, scope, receive, send):
        if scope.get("type") in {"http", "websocket"}:
            path = scope.get("path") or ""
            if path == self.prefix:
                scope = dict(scope)
                scope["path"] = "/"
            elif path.startswith(self.prefix + "/"):
                scope = dict(scope)
                scope["path"] = path[len(self.prefix) :]
        await self.app(scope, receive, send)


app = PrefixStrippingASGI(backend_app)
