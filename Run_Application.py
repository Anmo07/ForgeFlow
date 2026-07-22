#!/usr/bin/env python3
"""
ForgeFlow Application Build & Auto-Launcher
===========================================
This Python script builds and starts the ForgeFlow full-stack application
(FastAPI backend, Next.js frontend, PostgreSQL, Redis, MinIO, Nginx)
and automatically opens the web application in your default web browser.

Usage:
    python3 Run_Application.py
    or
    ./Run_Application.py
"""

import os
import sys
import time
import shutil
import socket
import secrets
import subprocess
import webbrowser
import urllib.request
from pathlib import Path

# ANSI Color Code Constants
BOLD = "\033[1m"
GREEN = "\033[0;32m"
BLUE = "\033[0;34m"
CYAN = "\033[0;36m"
YELLOW = "\033[1;33m"
RED = "\033[0;31m"
RESET = "\033[0m"

def log_info(msg: str):
    print(f"{BLUE}[INFO]{RESET} {msg}")

def log_success(msg: str):
    print(f"{GREEN}[SUCCESS]{RESET} {msg}")

def log_warn(msg: str):
    print(f"{YELLOW}[WARN]{RESET} {msg}")

def log_error(msg: str):
    print(f"{RED}[ERROR]{RESET} {msg}")

def get_project_root() -> Path:
    script_dir = Path(__file__).resolve().parent
    if (script_dir / "ForgeFlow").is_dir():
        return script_dir / "ForgeFlow"
    return script_dir

def load_env_file(project_root: Path):
    env_file = project_root / ".env"
    env_example = project_root / ".env.example"

    if not env_file.exists():
        if env_example.exists():
            log_warn(".env file not found. Creating from .env.example...")
            shutil.copy(env_example, env_file)
            log_success("Created .env successfully.")
        else:
            log_error("Neither .env nor .env.example found!")
            sys.exit(1)

    # Load key-values into os.environ
    if env_file.exists():
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if k and k not in os.environ:
                    os.environ[k] = v

    # Ensure required JWT secret key is valid
    jwt_val = os.environ.get("JWT_SECRET_KEY")
    if not jwt_val or jwt_val == "CHANGE_ME_TO_A_STRONG_RANDOM_VALUE":
        gen_key = secrets.token_urlsafe(64)
        os.environ["JWT_SECRET_KEY"] = gen_key
        log_info("Generated secure temporary JWT_SECRET_KEY for session authorization.")

def is_docker_available() -> bool:
    if not shutil.which("docker"):
        return False
    try:
        res = subprocess.run(["docker", "info"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=4)
        return res.returncode == 0
    except Exception:
        return False

def wait_for_any_url(urls: list[str], service_name: str, timeout: int = 40) -> str:
    log_warn(f"Waiting for {service_name} ({', '.join(urls)})...")
    start_time = time.time()
    while time.time() - start_time < timeout:
        for url in urls:
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "ForgeFlow-Launcher/1.0"})
                with urllib.request.urlopen(req, timeout=2) as response:
                    if response.status in (200, 301, 302, 404):
                        print()
                        log_success(f"{service_name} is UP and responding at {url}!")
                        return url
            except Exception:
                pass
        time.sleep(1.5)
        print(".", end="", flush=True)
    print()
    log_warn(f"Service status check complete. Target URL: {urls[0]}")
    return urls[0]

def run_docker_stack(project_root: Path) -> str:
    log_info("Docker daemon is active. Launching containerized stack...")
    compose_file = project_root / "infra" / "docker-compose.yml"
    env_file = project_root / ".env"

    compose_cmd = ["docker", "compose", "--env-file", str(env_file), "-f", str(compose_file)]

    # 1. Start database services
    log_info("[1/5] Starting database services (Postgres, Redis, MinIO)...")
    subprocess.run(compose_cmd + ["up", "-d", "postgres", "redis", "minio"], check=True)

    # 2. Wait for Postgres health
    log_info("[2/5] Waiting for PostgreSQL database container health...")
    for _ in range(60):
        res = subprocess.run(
            ["docker", "inspect", "--format={{.State.Health.Status}}", "forgeflow_postgres"],
            capture_output=True,
            text=True
        )
        if "healthy" in res.stdout.strip():
            print()
            log_success("Postgres database is healthy!")
            break
        time.sleep(1)
        print(".", end="", flush=True)
    print()

    # 3. Build backend and run migrations
    log_info("[3/5] Building backend container & running Alembic database migrations...")
    subprocess.run(compose_cmd + ["build", "backend"], check=True)
    subprocess.run(
        compose_cmd + [
            "run", "--rm",
            "-e", "DATABASE_URL=postgresql+psycopg2://postgres:postgres@postgres:5432/forgeflow",
            "backend", "alembic", "upgrade", "head"
        ],
        check=False
    )

    # 4. Seed database
    log_info("[4/5] Seeding database with initial data...")
    subprocess.run(
        compose_cmd + [
            "run", "--rm",
            "-e", "DATABASE_URL=postgresql+psycopg2://postgres:postgres@postgres:5432/forgeflow",
            "backend", "python", "scripts/seed_data.py"
        ],
        check=False
    )

    # 5. Launch full stack
    log_info("[5/5] Launching complete application stack (Frontend, Backend, Celery, Nginx)...")
    subprocess.run(compose_cmd + ["up", "-d", "--build"], check=True)

    target_url = wait_for_any_url(
        ["http://localhost", "http://localhost:3000", "http://localhost:3001"],
        "ForgeFlow Web Application"
    )
    return target_url

def check_local_postgres() -> bool:
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        res = sock.connect_ex(('localhost', 5432))
        sock.close()
        return res == 0
    except Exception:
        return False

def run_local_stack(project_root: Path) -> str:
    log_warn("Docker daemon unavailable. Starting local development servers...")
    backend_dir = project_root / "backend"
    frontend_dir = project_root / "frontend"

    # Configure DB URL fallback for local dev if Postgres is not listening
    if not check_local_postgres():
        log_warn("Local PostgreSQL port 5432 not active. Configuring SQLite database...")
        sqlite_db = project_root / "dev.db"
        os.environ["DATABASE_URL"] = f"sqlite:///{sqlite_db.resolve()}"

    # Set up child process environment
    env = os.environ.copy()

    # Start FastAPI Backend
    log_info("Starting FastAPI Backend server on port 8000...")
    venv_py = backend_dir / ".venv" / "bin" / "python"
    py_exec = str(venv_py) if venv_py.exists() else sys.executable
    subprocess.Popen(
        [py_exec, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=str(backend_dir),
        env=env
    )

    # Start Next.js Frontend
    log_info("Starting Next.js Frontend server...")
    npm_cmd = shutil.which("npm") or "npm"
    script_mode = "dev"
    log_info(f"Launching Next.js frontend using 'npm run {script_mode}'...")
    subprocess.Popen(
        [npm_cmd, "run", script_mode],
        cwd=str(frontend_dir),
        env=env
    )

    target_url = wait_for_any_url(
        ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
        "ForgeFlow Next.js Web Application"
    )
    return target_url

def main():
    print(f"{BLUE}{BOLD}")
    print("================================================================================")
    print("                ⚙️  FORGEFLOW SYSTEM LAUNCHER (PYTHON)                         ")
    print("================================================================================")
    print(f"{RESET}")

    project_root = get_project_root()
    os.chdir(project_root)
    log_info(f"Project Root: {project_root}")

    load_env_file(project_root)

    if is_docker_available():
        target_url = run_docker_stack(project_root)
    else:
        target_url = run_local_stack(project_root)

    print()
    print(f"{GREEN}{BOLD}================================================================================")
    print("           ✨ FORGEFLOW SYSTEM IS UP AND READY TO USE!                          ")
    print("================================================================================")
    print(f"{RESET}")
    print(f"{BOLD}Active System Endpoints:{RESET}")
    print(f"  🌐  {GREEN}Web Application URL:{RESET}       {target_url}")
    print(f"  ⚡  {GREEN}FastAPI Backend API:{RESET}       http://localhost:8000")
    print(f"  📚  {GREEN}Swagger API Documentation:{RESET} http://localhost:8000/docs")
    print("================================================================================")
    print()

    log_info(f"🚀 Auto-launching Web Application in default browser: {BOLD}{target_url}{RESET}")
    webbrowser.open(target_url)

if __name__ == "__main__":
    main()
