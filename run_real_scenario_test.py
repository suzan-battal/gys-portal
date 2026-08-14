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

def run_real_scenario():
    results = {}

    # Step 0: Get Master Super Admin Token to create users
    status, res = post("/api/auth/login", {"email": "superadmin@universite.edu.tr", "password": "SuperAdmin123!"})
    assert status == 200 and res.get("success"), f"Master login failed: {res}"
    master_token = res["token"]

    # 1. Create 3 Distinct Real Users
    users_to_create = [
        {"name": "Admin Leyla Demir", "email": "leyla.admin@universite.edu.tr", "password": "AdminPass_2026!", "role": "admin", "status": "Active"},
        {"name": "Prof. Murat Yilmaz", "email": "murat.trainer@universite.edu.tr", "password": "TrainerPass_2026!", "role": "trainer", "status": "Active"},
        {"name": "Employee Canan Kaya", "email": "canan.employee@universite.edu.tr", "password": "EmployeePass_2026!", "role": "employee", "status": "Active"}
    ]

    created_users = {}
    for u in users_to_create:
        status, res = post("/api/users", u, token=master_token)
        if status == 201:
            created_users[u["email"]] = res["user"]
        else:
            # If already exists from previous run, get by login
            created_users[u["email"]] = u

    # 2. Test Login for Each User
    tokens = {}
    
    # 2a. Admin Login
    status, res = post("/api/auth/login", {"email": "leyla.admin@universite.edu.tr", "password": "AdminPass_2026!"})
    assert status == 200 and res["user"]["role"] == "admin"
    tokens["admin"] = res["token"]
    results["admin_login"] = {"status": "SUCCESS", "user": res["user"], "dashboard": "Administrator Dashboard"}

    # 2b. Trainer Login
    status, res = post("/api/auth/login", {"email": "murat.trainer@universite.edu.tr", "password": "TrainerPass_2026!"})
    assert status == 200 and res["user"]["role"] == "trainer"
    tokens["trainer"] = res["token"]
    results["trainer_login"] = {"status": "SUCCESS", "user": res["user"], "dashboard": "Trainer (Faculty) Dashboard"}

    # 2c. Employee Login
    status, res = post("/api/auth/login", {"email": "canan.employee@universite.edu.tr", "password": "EmployeePass_2026!"})
    assert status == 200 and res["user"]["role"] == "student"  # mapped to student/employee
    tokens["employee"] = res["token"]
    results["employee_login"] = {"status": "SUCCESS", "user": res["user"], "dashboard": "Employee / Student Dashboard"}

    # 3. RBAC & Security Permission Tests
    # 3a. Employee tries to create a new user (MUST BE FORBIDDEN 403)
    status, res = post("/api/users", {"name": "Hacked User", "email": "hack@uni.edu", "password": "123", "role": "admin"}, token=tokens["employee"])
    results["employee_create_user_attempt"] = {"status": status, "blocked": status == 403, "message": res.get("error")}

    # 3b. Employee tries to access Audit Logs (MUST BE FORBIDDEN 403)
    status, res = get("/api/audit-logs", token=tokens["employee"])
    results["employee_access_audit_logs"] = {"status": status, "blocked": status == 403, "message": res.get("error")}

    # 3c. Trainer tries to create users (MUST BE FORBIDDEN 403)
    status, res = post("/api/users", {"name": "Trainer Hacked", "email": "thack@uni.edu", "password": "123", "role": "admin"}, token=tokens["trainer"])
    results["trainer_create_user_attempt"] = {"status": status, "blocked": status == 403, "message": res.get("error")}

    # 3d. Admin creates and manages users (MUST BE ALLOWED 200/201)
    status, res = get("/api/users", token=tokens["admin"])
    results["admin_view_users"] = {"status": status, "allowed": status == 200, "count": len(res.get("users", []))}

    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    run_real_scenario()
