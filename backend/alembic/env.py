import os
from logging.config import fileConfig

# pyrefly: ignore [missing-import]
from sqlalchemy import engine_from_config, pool
from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
db_url = os.getenv("DATABASE_URL")
if db_url:
    config.set_main_option("sqlalchemy.url", db_url)

if config.config_file_name is not None:
    try:
        fileConfig(config.config_file_name)
    except Exception:
        # Ignore missing logging config sections
        pass

# add your model's MetaData object for 'autogenerate' support
# from your app's model import Base
import sys
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

try:
    from app.common.database import Base
    from app.auth.models import User
    from app.organizations.models import Organization
    from app.roles.models import Role, role_permissions
    from app.permissions.models import Permission
    from app.memberships.models import Membership
    from app.sessions.models import Session
    from app.activity_logs.models import ActivityLog
    from app.api_keys.models import APIKey
    from app.projects.models import Project, Task
    from app.crm.models import Client, Lead, Deal
    from app.invoices.models import Invoice, InvoiceLineItem
except ModuleNotFoundError:
    sys_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if sys_path not in sys.path:
        sys.path.append(sys_path)
    from backend.app.common.database import Base
    from backend.app.auth.models import User
    from backend.app.organizations.models import Organization
    from backend.app.roles.models import Role, role_permissions
    from backend.app.permissions.models import Permission
    from backend.app.memberships.models import Membership
    from backend.app.sessions.models import Session
    from backend.app.activity_logs.models import ActivityLog
    from backend.app.api_keys.models import APIKey
    from backend.app.projects.models import Project, Task
    from backend.app.crm.models import Client, Lead, Deal
    from backend.app.invoices.models import Invoice, InvoiceLineItem


# target_metadata is required for 'autogenerate'
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ...

def run_migrations_offline():
    """Run migrations in 'offline' mode.
    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DB driver available.
    Calls to context.execute() here emit the given string to the script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode.
    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
