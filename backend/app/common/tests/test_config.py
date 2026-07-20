import importlib
import os
import subprocess
import sys

def test_jwt_secret_required_in_production_mode(monkeypatch):
    monkeypatch.delenv('JWT_SECRET_KEY', raising=False)
    monkeypatch.delenv('TESTING', raising=False)
    monkeypatch.delenv('DATABASE_URL', raising=False)
    env = os.environ.copy()
    env.pop('JWT_SECRET_KEY', None)
    env.pop('TESTING', None)
    env.pop('DATABASE_URL', None)
    result = subprocess.run([sys.executable, '-c', 'from app.common import config'], cwd=os.path.join(os.path.dirname(__file__), '..', '..', '..'), env=env, capture_output=True, text=True)
    assert result.returncode != 0
    assert 'JWT_SECRET_KEY' in result.stderr

def test_jwt_placeholder_rejected_in_production_mode(monkeypatch):
    monkeypatch.setenv('JWT_SECRET_KEY', 'CHANGE_ME_TO_A_STRONG_RANDOM_VALUE')
    monkeypatch.delenv('TESTING', raising=False)
    monkeypatch.setenv('DATABASE_URL', 'postgresql+psycopg2://localhost/forgeflow')
    env = os.environ.copy()
    env['JWT_SECRET_KEY'] = 'CHANGE_ME_TO_A_STRONG_RANDOM_VALUE'
    env['DATABASE_URL'] = 'postgresql+psycopg2://localhost/forgeflow'
    env.pop('TESTING', None)
    result = subprocess.run([sys.executable, '-c', 'from app.common import config'], cwd=os.path.join(os.path.dirname(__file__), '..', '..', '..'), env=env, capture_output=True, text=True)
    assert result.returncode != 0
    assert 'placeholder' in result.stderr.lower()

def test_config_loads_in_test_mode(monkeypatch):
    monkeypatch.setenv('JWT_SECRET_KEY', 'CHANGE_ME_TO_A_STRONG_RANDOM_VALUE')
    monkeypatch.setenv('DATABASE_URL', 'sqlite:///./test.db')
    import app.common.config as config_module
    importlib.reload(config_module)
    assert config_module.JWT_SECRET_KEY == 'CHANGE_ME_TO_A_STRONG_RANDOM_VALUE'

def test_production_environment_overrides_testing_flags(monkeypatch):
    monkeypatch.setenv('ENVIRONMENT', 'production')
    monkeypatch.setenv('TESTING', 'True')
    monkeypatch.setenv('DATABASE_URL', 'sqlite:///./test.db')
    import app.common.config as config_module
    assert config_module.is_testing() is False