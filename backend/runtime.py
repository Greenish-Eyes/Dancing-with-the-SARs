from typing import Any


def to_js_object(value: Any) -> Any:
    from js import Object  # type: ignore[reportMissingModuleSource]
    from pyodide.ffi import to_js

    return to_js(value, dict_converter=Object.fromEntries)


def from_js(value: Any) -> Any:
    if isinstance(value, (dict, list)):
        return value
    return value.to_py()
