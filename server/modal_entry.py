import modal

app = modal.App("aadee-backend")

image = (
    modal.Image.debian_slim()
    .pip_install_from_requirements("requirements.txt")
    .add_local_dir(".", "/root/app") 
)

secret = modal.Secret.from_name("aadeeinc-secrets")

@app.function(
    image=image,
    keep_warm=1,
    secrets=[secret],
)
@modal.asgi_app()
def fastapi():
    import sys
    sys.path.append("/root/app")
    from app.main import app as fastapi_app
    return fastapi_app

@app.function(
    image=image,
    secrets=[secret],
    schedule=modal.Cron("*/5 * * * *"),  # Run every 5 minutes
)
def action_worker():
    """Background worker to process approved actions"""
    import sys
    sys.path.append("/root/app")
    from app.action_worker import process_actions
    
    result = process_actions()
    print(f"Action worker completed: {result}")
    return result

@app.function(
    image=image,
    secrets=[secret],
)
def execute_action(action_id: str):
    """Execute a specific action by ID"""
    import sys
    sys.path.append("/root/app")
    from app.action_worker import execute_single_action
    
    result = execute_single_action(action_id)
    print(f"Executed action {action_id}: {result}")
    return result

@app.function(
    image=image,
    secrets=[secret],
)
def health_check():
    """Health check endpoint for the worker"""
    return {"status": "healthy", "timestamp": "now()"}

if __name__ == "__main__":
    import sys
    sys.path.append(".")
    from app.action_worker import process_actions
    result = process_actions()
    print(result)
