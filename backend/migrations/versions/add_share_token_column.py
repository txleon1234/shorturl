"""add share_token column

Revision ID: 1a1c34d6f032
Revises: add_client_host_column
Create Date: 2025-04-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_share_token_column'
down_revision = 'add_country_and_city_columns'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('urls', sa.Column('share_token', sa.String(), nullable=True))


def downgrade():
    # 删除 share_token 列
    op.drop_column('urls', 'share_token')
