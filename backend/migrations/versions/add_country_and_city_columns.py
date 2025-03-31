"""add country and city columns to clicks table

Revision ID: 15a8c4f7e938
Revises: add_client_host_column
Create Date: 2025-03-31 12:35:42.123456

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_country_and_city_columns'
down_revision = 'add_client_host_column'
branch_labels = None
depends_on = None


def upgrade():
    # Add 'country' and 'city' columns to the clicks table
    op.add_column('clicks', sa.Column('country', sa.String(), nullable=True))
    op.add_column('clicks', sa.Column('city', sa.String(), nullable=True))


def downgrade():
    # Remove the columns when downgrading
    op.drop_column('clicks', 'city')
    op.drop_column('clicks', 'country')
