"""add client_host column

Revision ID: ae4b5c7d9e12
Revises: add_missing_columns_to_clicks
Create Date: 2025-03-31 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_client_host_column'
down_revision = 'add_is_admin_and_site_settings'
branch_labels = None
depends_on = None


def upgrade():
    # 添加 client_host 列到 clicks 表
    op.add_column('clicks', sa.Column('client_host', sa.String(), nullable=True))


def downgrade():
    # 删除 client_host 列
    op.drop_column('clicks', 'client_host')
