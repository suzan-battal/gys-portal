import urllib.request
import json

BASE_URL = "http://localhost:8080"

def post(url, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE_URL}{url}", data=json.dumps(data).encode('utf-8'), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def get(url, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE_URL}{url}", headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def run_tests():
    print("=== 1. Testing Admin Login ===")
    status, res = post("/api/auth/login", {"email": "yonetici@universite.edu.tr", "password": "Admin123!"})
    assert status == 200 and res.get("success"), f"Admin login failed: {res}"
    admin_token = res["token"]
    print("✓ Admin logged in successfully!")

    print("\n=== 2. Testing Student Login ===")
    status, res = post("/api/auth/login", {"email": "mehmet.demir@universite.edu.tr", "password": "Ogrenci123!"})
    assert status == 200 and res["user"]["role"] == "student", f"Student login failed: {res}"
    print(f"✓ Student logged in: {res['user']['name']} ({res['user']['role']})")

    print("\n=== 3. Testing Trainer Login ===")
    status, res = post("/api/auth/login", {"email": "ahmet.yilmaz@universite.edu.tr", "password": "Egitmen123!"})
    assert status == 200 and res["user"]["role"] == "trainer", f"Trainer login failed: {res}"
    print(f"✓ Trainer logged in: {res['user']['name']} ({res['user']['role']})")

    print("\n=== 4. Admin Creates New Multi-User Employee / Student ===")
    new_user_data = {
        "name": "Selin Aydin",
        "email": "selin.aydin@universite.edu.tr",
        "password": "SelinPassword123!",
        "role": "employee",
        "status": "Active"
    }
    status, res = post("/api/users", new_user_data, token=admin_token)
    assert status == 201 and res.get("success"), f"Create user failed: {res}"
    new_user_id = res["user"]["id"]
    print(f"✓ Created new user: ID={new_user_id}, Name={res['user']['name']}, Role={res['user']['role']}, Status={res['user']['status']}")

    print("\n=== 5. New User Logs In With Their Own Email & Password ===")
    status, res = post("/api/auth/login", {"email": "selin.aydin@universite.edu.tr", "password": "SelinPassword123!"})
    assert status == 200 and res.get("success"), f"New user login failed: {res}"
    print(f"✓ Selin logged in independently: {res['user']}")

    print("\n=== 6. Admin Deactivates (Sets Passive) User Account ===")
    status, res = post(f"/api/users/{new_user_id}/toggle-status", {}, token=admin_token)
    assert status == 200 and res["user"]["status"] == "Passive", f"Toggle status failed: {res}"
    print(f"✓ User status is now: {res['user']['status']}")

    print("\n=== 7. Passive User Tries to Login (Should Be Blocked with 403) ===")
    status, res = post("/api/auth/login", {"email": "selin.aydin@universite.edu.tr", "password": "SelinPassword123!"})
    assert status == 403, f"Expected 403 for passive user, got {status}: {res}"
    print(f"✓ Passive user blocked correctly: {res['error']}")

    print("\n=== 8. Admin Reactivates User (Sets Active) ===")
    status, res = post(f"/api/users/{new_user_id}/toggle-status", {}, token=admin_token)
    assert status == 200 and res["user"]["status"] == "Active", f"Reactivate failed: {res}"
    print(f"✓ User status reactivated: {res['user']['status']}")

    print("\n=== 9. Admin Resets User Password ===")
    status, res = post(f"/api/users/{new_user_id}/reset-password", {"password": "NewSecretPass789!"}, token=admin_token)
    assert status == 200 and res.get("success"), f"Reset password failed: {res}"
    print("✓ Admin reset password successfully!")

    print("\n=== 10. User Logs In With New Password ===")
    status, res = post("/api/auth/login", {"email": "selin.aydin@universite.edu.tr", "password": "NewSecretPass789!"})
    assert status == 200 and res.get("success"), f"Login with new password failed: {res}"
    print("✓ User successfully signed in with newly reset password!")

    print("\n==============================================")
    print("🎉 ALL 10 MULTI-USER AUTHENTICATION TESTS PASSED!")
    print("==============================================")

if __name__ == "__main__":
    run_tests()
