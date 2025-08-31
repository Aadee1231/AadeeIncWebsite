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
