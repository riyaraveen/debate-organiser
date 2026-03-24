import random
from typing import List


def assign_roles(format_roles: list, participant_ids: List[int]) -> List[dict]:
    """
    Given a format's role definitions and a list of participant user IDs,
    return a list of {user_id, role_name, side} assignments.

    Roles are assigned in order. If there are more participants than roles,
    the extra participants are assigned as 'Observer'.
    """
    assignments = []
    shuffled = participant_ids[:]
    random.shuffle(shuffled)

    for i, user_id in enumerate(shuffled):
        if i < len(format_roles):
            role = format_roles[i]
            assignments.append({
                "user_id": user_id,
                "role_name": role.get("name", "Participant"),
                "side": role.get("side", "neutral"),
            })
        else:
            assignments.append({
                "user_id": user_id,
                "role_name": "Observer",
                "side": "neutral",
            })

    return assignments


def random_pairs(participant_ids: List[int]) -> List[tuple]:
    """Split participants into two roughly equal groups (proposition/opposition)."""
    shuffled = participant_ids[:]
    random.shuffle(shuffled)
    mid = len(shuffled) // 2
    return shuffled[:mid], shuffled[mid:]
