#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

def main():
    """Run administrative tasks."""
    try:
        import pymysql
        pymysql.version_info = (2, 2, 1, 'final', 0)
        pymysql.install_as_MySQLdb()

        from django.db.backends.base.base import BaseDatabaseWrapper
        BaseDatabaseWrapper.check_database_version_supported = lambda self: None

        from django.db.backends.mysql.features import DatabaseFeatures
        DatabaseFeatures.can_return_columns_from_insert = property(lambda self: False)
    except Exception:
        pass

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
