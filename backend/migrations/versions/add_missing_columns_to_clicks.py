"""Add missing columns to clicks table

Revision ID: add_missing_columns_to_clicks
Revises: 1a1c34d6f032
Create Date: 2025-03-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_missing_columns_to_clicks'
down_revision = '1a1c34d6f032'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('clicks', sa.Column('operating_system', sa.String(), nullable=True))
    op.add_column('clicks', sa.Column('location', sa.String(), nullable=True))

def downgrade():
    op.drop_column('clicks', 'location')
    op.drop_column('clicks', 'operating_system')
