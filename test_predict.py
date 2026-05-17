import requests

url = "http://127.0.0.1:5000/predict"

image_path = r"C:\Users\94772\Desktop\Ko.png"

with open(image_path, "rb") as f:
    files = {"image": f}
    response = requests.post(url, files=files)

print(response.json())