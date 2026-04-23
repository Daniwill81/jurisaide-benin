import base64
import json

import requests

# Configuration
AUTH_KEY = "ZKgvVe2oc4xa3SBwvbZaiSJdrk6cIqOT"
BASE_URL = "http://localhost:8000/api/v1"
auth_header = f"Basic {base64.b64encode(f'{AUTH_KEY}:{AUTH_KEY}'.encode()).decode()}"
headers = {"Authorization": auth_header}


def test_calculation_detail():
    # First get a calculation ID
    print("--- Getting calculations list ---")
    response = requests.get(f"{BASE_URL}/calculations/", headers=headers)
    if response.status_code == 200:
        data = response.json()
        if data["data"]:
            calc_id = data["data"][0]["id"]
            print(f"--- Testing detail for calculation {calc_id} ---")
            response_detail = requests.get(f"{BASE_URL}/calculations/{calc_id}/", headers=headers)
            print(f"Status Code: {response_detail.status_code}")
            if response_detail.status_code == 200:
                print(json.dumps(response_detail.json(), indent=2))
            else:
                print(f"Error: {response_detail.text}")
        else:
            print("No calculations found.")
    else:
        print(f"List Error: {response.text}")


if __name__ == "__main__":
    test_calculation_detail()
