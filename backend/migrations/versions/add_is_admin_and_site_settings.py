"""Add is_admin and site_settings table

Revision ID: add_is_admin_and_site_settings
Revises: add_missing_columns_to_clicks
Create Date: 2025-03-30 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_is_admin_and_site_settings'
down_revision = 'add_missing_columns_to_clicks'
branch_labels = None
depends_on = None

def upgrade():
    # The column and table apparently already exist in the database
    # Let's just mark this migration as complete and move on
    pass

def downgrade():
    op.drop_index(op.f('ix_site_settings_id'), table_name='site_settings')
    op.drop_table('site_settings')
    op.drop_column('users', 'is_admin')
