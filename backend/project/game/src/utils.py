import json
from decimal import Decimal
from enum import Enum, auto

__all__ = ["GameMode", "NumericEncoder"]


class GameMode(Enum):
    LOCAL = auto()
    ONLINE = auto()
    BACKGROUND = auto()


class NumericEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (Decimal, float)):
            return float(obj)
        elif hasattr(obj, "x") and hasattr(obj, "y") and hasattr(obj, "z"):
            return {"x": obj.x, "y": obj.y, "z": obj.z, "_type": "vector3"}
        return super().default(obj)
