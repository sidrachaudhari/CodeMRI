
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from alembic import context
from sqlalchemy import engine_from_config, pool

# --------------------------------------------------
# 1. Locate backend and configure sys.path
# --------------------------------------------------

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Load backend/.env
load_dotenv(BACKEND_DIR / ".env")

from app.models import Base


# --------------------------------------------------
# 2. Read the Neon database URL
# --------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL is missing. Check your backend/.env file."
    )


# --------------------------------------------------
# 3. Configure Alembic
# --------------------------------------------------

config = context.config

# Replace the placeholder URL with the actual Neon URL.
# Escape percent signs for Alembic configuration parsing.
config.set_main_option(
    "sqlalchemy.url",
    DATABASE_URL.replace("%", "%%")
)


# --------------------------------------------------
# 4. Register SQLAlchemy metadata and filters
# --------------------------------------------------

target_metadata = Base.metadata


def include_object(
    object,
    name,
    type_,
    reflected,
    compare_to
):
    # Preserve the existing legacy table.
    if type_ == "table" and name == "codemri_scans":
        return False

    return True


# --------------------------------------------------
# 5. Offline migration mode
# --------------------------------------------------

def run_migrations_offline():

    url = config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


# --------------------------------------------------
# 6. Online migration mode
# --------------------------------------------------

def run_migrations_online():

    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()

    connectable.dispose()


# --------------------------------------------------
# 7. Execute migrations
# --------------------------------------------------

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
