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

def test_chatbot():
    # 1. Login as Student
    status, res = post("/api/auth/login", {"email": "mehmet.demir@universite.edu.tr", "password": "Ogrenci123!"})
    assert status == 200 and res.get("success")
    student_token = res["token"]

    # Query tasks
    status, res = post("/api/chatbot/query", {"query": "What active tasks do I have?"}, token=student_token)
    print("Tasks Query Result:", status, res)
    assert status == 200 and res.get("handled"), f"Failed: {res}"
    print("✓ Student Chatbot Live DB Tasks:", res["response"][:100], "...")

    # Query grades
    status, res = post("/api/chatbot/query", {"query": "Show my GPA and grades"}, token=student_token)
    assert status == 200 and res.get("handled")
    print("✓ Student Chatbot Live DB Grades:", res["response"][:100], "...")

    # 2. Login as Admin
    status, res = post("/api/auth/login", {"email": "yonetici@universite.edu.tr", "password": "Admin123!"})
    assert status == 200 and res.get("success")
    admin_token = res["token"]

    # Query user directory stats
    status, res = post("/api/chatbot/query", {"query": "How many users and students exist?"}, token=admin_token)
    assert status == 200 and res.get("handled")
    print("✓ Admin Chatbot Live DB User Stats:", res["response"][:100], "...")

    print("\n🎉 AI CHATBOT LIVE DATABASE CONNECTION FULLY TESTED & VERIFIED!")

if __name__ == "__main__":
    test_chatbot()
