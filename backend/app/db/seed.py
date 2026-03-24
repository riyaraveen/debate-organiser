"""Seed the database with built-in debate formats and an admin user."""
from app.db.database import SessionLocal, engine
from app.models import *  # noqa: F401 — ensure all models are registered
from app.db.database import Base
from app.models.debate_format import DebateFormat
from app.models.user import User, UserRole
from app.models.club_settings import ClubSettings
from app.services.auth import hash_password

FORMATS = [
    {
        "name": "Oxford Style",
        "description": "A formal parliamentary-style debate with a proposition and opposition team. "
                       "The audience votes before and after; the team that shifts more votes wins.",
        "min_participants": 4,
        "max_participants": 8,
        "is_builtin": True,
        "rules_summary": (
            "1. Motion is debated by two teams: Proposition and Opposition.\n"
            "2. Opening speeches followed by floor debate, then closing speeches.\n"
            "3. Audience votes before and after; largest shift in votes wins.\n"
            "4. Points of Information (POIs) may be offered during speeches.\n"
            "5. Speeches are typically 7 minutes each."
        ),
        "roles": [
            {"name": "Proposition Speaker 1", "side": "proposition", "order": 1, "description": "Opens the case for the motion"},
            {"name": "Opposition Speaker 1", "side": "opposition", "order": 2, "description": "Opens the case against the motion"},
            {"name": "Proposition Speaker 2", "side": "proposition", "order": 3, "description": "Develops and defends the proposition case"},
            {"name": "Opposition Speaker 2", "side": "opposition", "order": 4, "description": "Develops and defends the opposition case"},
            {"name": "Chair", "side": "neutral", "order": 0, "description": "Moderates the debate and manages time"},
            {"name": "Timekeeper", "side": "neutral", "order": 0, "description": "Tracks speaking time"},
        ],
        "speaking_order": [
            {"role": "Proposition Speaker 1", "duration_seconds": 420, "description": "Opening speech"},
            {"role": "Opposition Speaker 1", "duration_seconds": 420, "description": "Opening speech"},
            {"role": "Proposition Speaker 2", "duration_seconds": 420, "description": "Development speech"},
            {"role": "Opposition Speaker 2", "duration_seconds": 420, "description": "Development speech"},
            {"role": "Opposition Speaker 1", "duration_seconds": 300, "description": "Summary/closing"},
            {"role": "Proposition Speaker 1", "duration_seconds": 300, "description": "Summary/closing"},
        ],
    },
    {
        "name": "British Parliamentary (BP)",
        "description": "Four teams of two debate a motion from four positions: "
                       "Opening Government, Opening Opposition, Closing Government, Closing Opposition.",
        "min_participants": 8,
        "max_participants": 10,
        "is_builtin": True,
        "rules_summary": (
            "1. Four teams: Opening Government (OG), Opening Opposition (OO), "
            "Closing Government (CG), Closing Opposition (CO).\n"
            "2. Each speaker gives one 7-minute speech.\n"
            "3. Points of Information (POIs) can be offered between minutes 1 and 6.\n"
            "4. Judges rank all four teams 1st–4th.\n"
            "5. Closing teams must introduce a new extension to their side's case."
        ),
        "roles": [
            {"name": "Prime Minister (OG)", "side": "government", "order": 1, "description": "Opens the government case"},
            {"name": "Leader of Opposition (OO)", "side": "opposition", "order": 2, "description": "Opens the opposition case"},
            {"name": "Deputy Prime Minister (OG)", "side": "government", "order": 3, "description": "Extends and defends OG case"},
            {"name": "Deputy Leader of Opposition (OO)", "side": "opposition", "order": 4, "description": "Extends and defends OO case"},
            {"name": "Member for Government (CG)", "side": "government", "order": 5, "description": "Introduces CG extension"},
            {"name": "Member for Opposition (CO)", "side": "opposition", "order": 6, "description": "Introduces CO extension"},
            {"name": "Government Whip (CG)", "side": "government", "order": 7, "description": "Summarises government bench"},
            {"name": "Opposition Whip (CO)", "side": "opposition", "order": 8, "description": "Summarises opposition bench"},
            {"name": "Chair", "side": "neutral", "order": 0, "description": "Moderates the debate"},
            {"name": "Timekeeper", "side": "neutral", "order": 0, "description": "Tracks speaking time"},
        ],
        "speaking_order": [
            {"role": "Prime Minister (OG)", "duration_seconds": 420, "description": "1st speech"},
            {"role": "Leader of Opposition (OO)", "duration_seconds": 420, "description": "2nd speech"},
            {"role": "Deputy Prime Minister (OG)", "duration_seconds": 420, "description": "3rd speech"},
            {"role": "Deputy Leader of Opposition (OO)", "duration_seconds": 420, "description": "4th speech"},
            {"role": "Member for Government (CG)", "duration_seconds": 420, "description": "5th speech"},
            {"role": "Member for Opposition (CO)", "duration_seconds": 420, "description": "6th speech"},
            {"role": "Government Whip (CG)", "duration_seconds": 420, "description": "7th speech"},
            {"role": "Opposition Whip (CO)", "duration_seconds": 420, "description": "8th speech"},
        ],
    },
    {
        "name": "Lincoln-Douglas (LD)",
        "description": "A one-on-one debate focused on values and philosophy. "
                       "Common in US high school and college circuits.",
        "min_participants": 2,
        "max_participants": 4,
        "is_builtin": True,
        "rules_summary": (
            "1. One Affirmative (Aff) debater vs one Negative (Neg) debater.\n"
            "2. Aff speaks first, then Neg, then cross-examinations alternate.\n"
            "3. Speeches: Aff Constructive (6 min), Neg Constructive (7 min), "
            "1AR (4 min), Neg Rebuttal (6 min), 2AR (3 min).\n"
            "4. Each side has 4 minutes of prep time.\n"
            "5. Focused on value framework and ethical reasoning."
        ),
        "roles": [
            {"name": "Affirmative", "side": "affirmative", "order": 1, "description": "Argues in favour of the resolution"},
            {"name": "Negative", "side": "negative", "order": 2, "description": "Argues against the resolution"},
            {"name": "Judge", "side": "neutral", "order": 0, "description": "Evaluates and decides the winner"},
            {"name": "Timekeeper", "side": "neutral", "order": 0, "description": "Tracks speaking time"},
        ],
        "speaking_order": [
            {"role": "Affirmative", "duration_seconds": 360, "description": "Affirmative Constructive (AC)"},
            {"role": "Negative", "duration_seconds": 180, "description": "Cross-examination of Aff by Neg"},
            {"role": "Negative", "duration_seconds": 420, "description": "Negative Constructive (NC)"},
            {"role": "Affirmative", "duration_seconds": 180, "description": "Cross-examination of Neg by Aff"},
            {"role": "Affirmative", "duration_seconds": 240, "description": "1st Affirmative Rebuttal (1AR)"},
            {"role": "Negative", "duration_seconds": 360, "description": "Negative Rebuttal (NR)"},
            {"role": "Affirmative", "duration_seconds": 180, "description": "2nd Affirmative Rebuttal (2AR)"},
        ],
    },
    {
        "name": "US Collegiate Policy",
        "description": "A fast-paced two-on-two debate where teams research a year-long policy resolution. "
                       "Known for speed ('spreading') and evidence-heavy argumentation.",
        "min_participants": 4,
        "max_participants": 6,
        "is_builtin": True,
        "rules_summary": (
            "1. Two teams of two: Affirmative (Aff) and Negative (Neg).\n"
            "2. Affirmative must defend a specific policy plan.\n"
            "3. Speech order: 1AC, 1NC, 2AC, 2NC, 1NR, 1AR, 2NR, 2AR.\n"
            "4. Each constructive is 8 minutes; rebuttals are 5 minutes.\n"
            "5. Each team has 8 minutes of prep time total.\n"
            "6. Heavily evidence-based; speed of delivery is common."
        ),
        "roles": [
            {"name": "First Affirmative (1A)", "side": "affirmative", "order": 1, "description": "Reads the 1AC, gives 1AR and 2AR"},
            {"name": "Second Affirmative (2A)", "side": "affirmative", "order": 2, "description": "Gives 2AC and 1AR cross-ex"},
            {"name": "First Negative (1N)", "side": "negative", "order": 3, "description": "Gives 1NC and 2NR"},
            {"name": "Second Negative (2N)", "side": "negative", "order": 4, "description": "Gives 2NC and 1NR"},
            {"name": "Judge", "side": "neutral", "order": 0, "description": "Evaluates and decides"},
            {"name": "Timekeeper", "side": "neutral", "order": 0, "description": "Tracks speaking time"},
        ],
        "speaking_order": [
            {"role": "First Affirmative (1A)", "duration_seconds": 480, "description": "1AC"},
            {"role": "First Negative (1N)", "duration_seconds": 180, "description": "Cross-ex of 1A by 1N"},
            {"role": "First Negative (1N)", "duration_seconds": 480, "description": "1NC"},
            {"role": "First Affirmative (1A)", "duration_seconds": 180, "description": "Cross-ex of 1N by 1A"},
            {"role": "Second Affirmative (2A)", "duration_seconds": 480, "description": "2AC"},
            {"role": "Second Negative (2N)", "duration_seconds": 180, "description": "Cross-ex of 2A by 2N"},
            {"role": "Second Negative (2N)", "duration_seconds": 480, "description": "2NC"},
            {"role": "Second Affirmative (2A)", "duration_seconds": 180, "description": "Cross-ex of 2N by 2A"},
            {"role": "First Negative (1N)", "duration_seconds": 300, "description": "1NR"},
            {"role": "First Affirmative (1A)", "duration_seconds": 300, "description": "1AR"},
            {"role": "Second Negative (2N)", "duration_seconds": 300, "description": "2NR"},
            {"role": "Second Affirmative (2A)", "duration_seconds": 300, "description": "2AR"},
        ],
    },
    {
        "name": "World Schools Debating (WSDC)",
        "description": "Three-on-three debate used in international competitions including the World Schools Debating Championships.",
        "min_participants": 6,
        "max_participants": 8,
        "is_builtin": True,
        "rules_summary": (
            "1. Two teams of three: Proposition and Opposition.\n"
            "2. Three constructive speeches + one Reply Speech per team.\n"
            "3. Points of Information (POIs) may be offered in minutes 1–7 of constructive speeches.\n"
            "4. Reply speeches are given by the 1st or 2nd speaker (not 3rd).\n"
            "5. Adjudicators score on matter, manner, and method."
        ),
        "roles": [
            {"name": "1st Proposition Speaker", "side": "proposition", "order": 1, "description": "Opens the case"},
            {"name": "1st Opposition Speaker", "side": "opposition", "order": 2, "description": "Rebuts and opens opposition case"},
            {"name": "2nd Proposition Speaker", "side": "proposition", "order": 3, "description": "Develops case and rebuts"},
            {"name": "2nd Opposition Speaker", "side": "opposition", "order": 4, "description": "Develops case and rebuts"},
            {"name": "3rd Proposition Speaker", "side": "proposition", "order": 5, "description": "Summarises and rebuts"},
            {"name": "3rd Opposition Speaker", "side": "opposition", "order": 6, "description": "Summarises and rebuts"},
            {"name": "Proposition Reply Speaker", "side": "proposition", "order": 7, "description": "Biased summary (1st or 2nd speaker)"},
            {"name": "Opposition Reply Speaker", "side": "opposition", "order": 8, "description": "Biased summary (1st or 2nd speaker)"},
            {"name": "Chair", "side": "neutral", "order": 0, "description": "Moderates debate"},
        ],
        "speaking_order": [
            {"role": "1st Proposition Speaker", "duration_seconds": 480, "description": "Constructive"},
            {"role": "1st Opposition Speaker", "duration_seconds": 480, "description": "Constructive"},
            {"role": "2nd Proposition Speaker", "duration_seconds": 480, "description": "Constructive"},
            {"role": "2nd Opposition Speaker", "duration_seconds": 480, "description": "Constructive"},
            {"role": "3rd Proposition Speaker", "duration_seconds": 480, "description": "Constructive"},
            {"role": "3rd Opposition Speaker", "duration_seconds": 480, "description": "Constructive"},
            {"role": "Opposition Reply Speaker", "duration_seconds": 240, "description": "Reply speech"},
            {"role": "Proposition Reply Speaker", "duration_seconds": 240, "description": "Reply speech"},
        ],
    },
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed formats
        for fmt_data in FORMATS:
            if not db.query(DebateFormat).filter(DebateFormat.name == fmt_data["name"]).first():
                db.add(DebateFormat(**fmt_data))

        # Seed default admin
        if not db.query(User).filter(User.email == "admin@debateclub.com").first():
            db.add(User(
                name="Admin",
                email="admin@debateclub.com",
                hashed_password=hash_password("admin123"),
                role=UserRole.admin,
            ))

        # Seed club settings
        if not db.query(ClubSettings).first():
            db.add(ClubSettings(club_name="Debate Club", school_name="Your School"))

        db.commit()
        print("Database seeded successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
