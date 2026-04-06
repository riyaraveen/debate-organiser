"""add_wins_losses_to_club_memberships

Revision ID: 49de4c00abda
Revises:
Create Date: 2026-04-06 18:00:45.056549

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '49de4c00abda'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('club_memberships', sa.Column('wins', sa.Integer(), server_default='0', nullable=False))
    op.add_column('club_memberships', sa.Column('losses', sa.Integer(), server_default='0', nullable=False))


def downgrade() -> None:
    op.drop_column('club_memberships', 'losses')
    op.drop_column('club_memberships', 'wins')
