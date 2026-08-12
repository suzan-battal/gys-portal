"""
Üniversite Görev Yönetim Sistemi - Otomatik Uçtan Uca Entegrasyon Testleri (E2E Test Suite)
Tüm rol izinlerini, CRUD operasyonlarını, dosya yükleme, notlandırma ve iş akışını test eder.
"""

import urllib.request
import urllib.parse
import json
import threading
import time
import os
import sys
import secrets
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

import server
import database as db

PORT = 8999
BASE_URL = f"http://127.0.0.1:{PORT}"


def start_test_server():
    server_address = ('127.0.0.1', PORT)
    httpd = server.ThreadedHTTPServer(server_address, server.TaskAppRequestHandler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    time.sleep(0.5)
    return httpd


def make_request(method: str, path: str, data: dict = None, token: str = None, raw_body: bytes = None, content_type: str = "application/json"):
    url = f"{BASE_URL}{path}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body_bytes = None
    if raw_body is not None:
        body_bytes = raw_body
        headers["Content-Type"] = content_type
    elif data is not None:
        body_bytes = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"

    req = urllib.request.Request(url, data=body_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read()
            content_type_resp = resp.headers.get("Content-Type", "")
            if "application/json" in content_type_resp:
                return resp.status, json.loads(resp_body.decode("utf-8"))
            return resp.status, resp_body
    except urllib.error.HTTPError as e:
        err_body = e.read()
        try:
            return e.code, json.loads(err_body.decode("utf-8"))
        except Exception:
            return e.code, err_body.decode("utf-8", errors="ignore")


def run_all_tests():
    print("\n=======================================================")
    print("🚀 Üniversite Görev Yönetim Sistemi - Test Süreci Başlıyor")
    print("=======================================================\n")

    httpd = start_test_server()
    rand_suffix = secrets.token_hex(3)
    student_email = f"ali_{rand_suffix}@universite.edu.tr"
    trainer_email = f"murat_{rand_suffix}@universite.edu.tr"

    # 1. TEST: Veritabanı Başlatma ve Tohumlama
    print("1. [Test] Veritabanı Tohumlama Kontrolü...")
    admin_user = db.get_user_by_email("yonetici@universite.edu.tr")
    assert admin_user is not None, "Yönetici kullanıcısı bulunamadı!"
    assert admin_user["role"] == "admin", "Yönetici rolü hatalı!"
    print("   ✓ Yönetici ve tohum verileri doğrulandı.")

    # 2. TEST: Yönetici Girişi (Admin Login)
    print("2. [Test] Yönetici Girişi (/api/auth/login)...")
    status, res = make_request("POST", "/api/auth/login", {
        "email": "yonetici@universite.edu.tr",
        "password": "Admin123!"
    })
    assert status == 200 and res["success"] is True, f"Admin girişi başarısız: {res}"
    admin_token = res["token"]
    print("   ✓ Yönetici girişi başarılı, oturum token'ı alındı.")

    # 3. TEST: Yanlış Şifre Kontrolü
    print("3. [Test] Hatalı Şifre Güvenlik Kontrolü...")
    status, res = make_request("POST", "/api/auth/login", {
        "email": "yonetici@universite.edu.tr",
        "password": "YanlisSifre!"
    })
    assert status == 401 and res["success"] is False, f"Hatalı şifre engellenemedi: {res}"
    print(f"   ✓ Güvenlik koruması çalışıyor: '{res['error']}'")

    # 4. TEST: Admin Yeni Öğrenci & Eğitmen Ekleme
    print("4. [Test] Yönetici Öğrenci ve Eğitmen Ekleme (/api/users)...")
    status, res = make_request("POST", "/api/users", {
        "name": "Test Öğrencisi Ali",
        "email": student_email,
        "password": "Ogrenci123!",
        "role": "student"
    }, token=admin_token)
    assert status == 201 and res["success"] is True, f"Öğrenci oluşturulamadı: {res}"
    test_student_id = res["user"]["id"]

    status, res = make_request("POST", "/api/users", {
        "name": "Prof. Dr. Test Eğitmeni Murat",
        "email": trainer_email,
        "password": "Egitmen123!",
        "role": "trainer"
    }, token=admin_token)
    assert status == 201 and res["success"] is True, f"Eğitmen oluşturulamadı: {res}"
    test_trainer_id = res["user"]["id"]
    print("   ✓ Yeni öğrenci ve eğitmen başarıyla oluşturuldu.")

    # 5. TEST: Admin Görev Oluşturma ve Atama
    print("5. [Test] Yönetici Görev Tanımlama ve Atama (/api/tasks)...")
    status, res = make_request("POST", "/api/tasks", {
        "title": "Veri Bilimi: Pandas ve NumPy ile Veri Analizi",
        "description": "Kaggle veri seti üzerinde veri temizleme, keşifsel veri analizi ve görselleştirme adımlarını içeren Jupyter Notebook hazırlayınız.",
        "deadline": "2026-09-01",
        "trainer_id": test_trainer_id,
        "student_id": test_student_id
    }, token=admin_token)
    assert status == 201 and res["success"] is True, f"Görev oluşturulamadı: {res}"
    test_task_id = res["task"]["id"]
    print(f"   ✓ Görev #{test_task_id} oluşturuldu ve atandı.")

    # 6. TEST: Öğrenci Girişi ve Görev Görüntüleme
    print("6. [Test] Öğrenci Girişi ve Atanan Görevleri Listeleme...")
    status, res = make_request("POST", "/api/auth/login", {
        "email": student_email,
        "password": "Ogrenci123!"
    })
    assert status == 200 and res["success"] is True
    student_token = res["token"]

    status, res = make_request("GET", "/api/tasks", token=student_token)
    assert status == 200 and len(res["tasks"]) >= 1, f"Öğrenci görevleri alınamadı: {res}"
    my_task = next(t for t in res["tasks"] if t["id"] == test_task_id)
    assert my_task["status"] == "Bekliyor", f"Görev başlangıç durumu 'Bekliyor' olmalı, gelen: {my_task['status']}"
    print(f"   ✓ Öğrenci görevi başarıyla listeledi (Durum: {my_task['status']}).")

    # 7. TEST: Yetkisiz Erişim Kontrolü (Öğrenci Admin Uç Noktasına Erişemez)
    print("7. [Test] Rol İzni Doğrulaması (Öğrencinin Kullanıcı Ekleme Denemesi)...")
    status, res = make_request("POST", "/api/users", {
        "name": "Hacker",
        "email": f"hacker_{rand_suffix}@test.com",
        "password": "123",
        "role": "admin"
    }, token=student_token)
    assert status == 403, f"Öğrenci yönetici işlemine erişti! Status: {status}"
    print(f"   ✓ Yetkisiz erişim 403 Forbidden ile engellendi: '{res.get('error')}'")

    # 8. TEST: Öğrencinin Ödev Dosyası Yükleyip Teslim Etmesi (Multipart Upload)
    print("8. [Test] Öğrenci Ödev Dosyası Yükleme ve Teslim Etme...")
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    file_content = b"# Python Veri Analizi Raporu - Ali\nimport pandas as pd\nimport numpy as np\nprint('Analiz tamamlandi')"
    filename = "veri_analizi_odevi_ali.py"

    multipart_body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="task_id"\r\n\r\n'
        f"{test_task_id}\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: text/x-python\r\n\r\n"
    ).encode("utf-8") + file_content + f"\r\n--{boundary}--\r\n".encode("utf-8")

    status, res = make_request(
        "POST", 
        "/api/submissions/upload", 
        raw_body=multipart_body, 
        token=student_token, 
        content_type=f"multipart/form-data; boundary={boundary}"
    )
    assert status == 200 and res["success"] is True, f"Dosya yükleme başarısız: {res}"
    submission_id = res["submission_id"]
    print(f"   ✓ Dosya yüklendi ve görev teslim edildi (Teslim ID: #{submission_id}).")

    # 9. TEST: Eğitmen Girişi, Teslimi İnceleme ve Notlandırma
    print("9. [Test] Eğitmen Girişi, Teslimi İnceleme ve Notlandırma...")
    status, res = make_request("POST", "/api/auth/login", {
        "email": trainer_email,
        "password": "Egitmen123!"
    })
    assert status == 200 and res["success"] is True
    trainer_token = res["token"]

    status, res = make_request("GET", "/api/submissions", token=trainer_token)
    assert status == 200 and len(res["submissions"]) >= 1
    sub_to_review = next(s for s in res["submissions"] if s["id"] == submission_id)
    assert sub_to_review["status"] == "Teslim Edildi"

    # Eğitmen değerlendirme yapıyor: 96.5 not + Türkçe geri bildirim
    status, res = make_request("POST", f"/api/submissions/{submission_id}/review", {
        "grade": 96.5,
        "feedback": "Harika bir çalışma Ali! Pandas veri temizleme adımların çok başarılı ve grafiklerin çok net. Tebrikler.",
        "status": "Tamamlandı"
    }, token=trainer_token)
    assert status == 200 and res["success"] is True, f"Değerlendirme kaydedilemedi: {res}"
    print(f"   ✓ Eğitmen değerlendirmesi kaydedildi (Not: 96.5, Durum: Tamamlandı).")

    # 10. TEST: Öğrencinin Not ve Geri Bildirimi Görüntülemesi
    print("10. [Test] Öğrenci Not ve Geri Bildirim Doğrulaması...")
    status, res = make_request("GET", f"/api/tasks/{test_task_id}", token=student_token)
    assert status == 200 and res["success"] is True
    updated_task = res["task"]
    assert updated_task["status"] == "Tamamlandı", f"Beklenen durum Tamamlandı, gelen: {updated_task['status']}"
    assert updated_task["grade"] == 96.5, f"Not hatalı: {updated_task['grade']}"
    assert "Harika bir çalışma" in updated_task["feedback"], f"Geri bildirim hatalı: {updated_task['feedback']}"
    print(f"   ✓ Öğrenci notunu ({updated_task['grade']}) ve geri bildirimini başarıyla doğruladı!")

    # 11. TEST: Dosya İndirme Uç Noktası
    print("11. [Test] Yüklenen Dosyanın Doğrudan İndirilebilirlik Kontrolü...")
    uploaded_file_path = updated_task["file_path"]
    status, content = make_request("GET", f"/uploads/{uploaded_file_path}")
    assert status == 200, f"Dosya indirilemedi! Status: {status}"
    assert b"Python Veri Analizi Raporu" in content, "İndirilen dosya içeriği eşleşmiyor!"
    print("   ✓ Yüklenen dosya sunucudan eksiksiz indirildi.")

    # 12. TEST: Çıkış Yapma (Logout)
    print("12. [Test] Çıkış Yapma (/api/auth/logout)...")
    status, res = make_request("POST", "/api/auth/logout", token=student_token)
    assert status == 200 and res["success"] is True
    print("   ✓ Çıkış işlemi başarıyla doğrulandı.")

    print("\n=======================================================")
    print("🎉 TÜM TESTLER BAŞARIYLA GEÇTİ! (12/12)")
    print("=======================================================\n")


if __name__ == "__main__":
    run_all_tests()
