from typing import Any


class AbortSignal:
    @staticmethod
    def timeout(milliseconds: int) -> Any: ...


class Object:
    @staticmethod
    def fromEntries(entries: Any) -> Any: ...


class Request:
    @staticmethod
    def new(input: str, init: Any = ...) -> Any: ...


class Uint8Array:
    @staticmethod
    def new(buffer: Any) -> Any: ...
