"""index articles published_at

Revision ID: 34adc1c877cf
Revises: bbea68515b73
Create Date: 2026-09-21 17:22:29.019023

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "34adc1c877cf"
down_revision: Union[str, Sequence[str], None] = "bbea68515b73"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index("ix_articles_published_at", "articles", ["published_at", "id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_articles_published_at", table_name="articles")
