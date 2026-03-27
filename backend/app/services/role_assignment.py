import random
from typing import List


def assign_roles(format_roles: list, participant_ids: List[int]) -> List[dict]:
    """
    Given a format's role definitions and a list of participant user IDs,
    return a list of {user_id, role_name, side} assignments.

    Roles with min_count > 1 (e.g. Audience x10, Adjudicator Panel x3) are
    expanded into multiple individual slots. All slots are shuffled together
    so every participant has an equal chance of being assigned any role.
    Extra participants beyond defined slots get 'Observer'.
    """
    expanded_roles = []
    for role in format_roles:
        count = role.get("min_count", 1)
        for _ in range(count):
            expanded_roles.append(role)

    random.shuffle(expanded_roles)

    shuffled_participants = participant_ids[:]
    random.shuffle(shuffled_participants)

    assignments = []
    for i, user_id in enumerate(shuffled_participants):
        if i < len(expanded_roles):
            role = expanded_roles[i]
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
