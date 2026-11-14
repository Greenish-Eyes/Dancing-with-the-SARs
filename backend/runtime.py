import json
from typing import Any


def to_js_object(value: Any) -> Any:
    from js import Object
    from pyodide.ffi import to_js

    return to_js(value, dict_converter=Object.fromEntries)


def from_js(value: Any) -> Any:
    from js import JSON

    return json.loads(str(JSON.stringify(value)))
