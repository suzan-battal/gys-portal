#!/usr/bin/env python3
import sqlite3

conn = sqlite3.connect("database.sqlite")
cursor = conn.cursor()

# Clean all audit logs descriptions
cursor.execute("UPDATE audit_logs SET description = REPLACE(description, 'Kullanıcı başarıyla oturum açtı:', 'User successfully authenticated:');")
cursor.execute("UPDATE audit_logs SET description = REPLACE(description, 'Kullanıcı başarıyla oturum açtı', 'User successfully authenticated');")
cursor.execute("UPDATE audit_logs SET description = REPLACE(description, 'Eğitmeni', 'Trainer');")
cursor.execute("UPDATE audit_logs SET description = REPLACE(description, 'Eğitmen', 'Trainer');")
cursor.execute("UPDATE audit_logs SET description = REPLACE(description, 'Öğrenci', 'Student');")
cursor.execute("UPDATE audit_logs SET description = REPLACE(description, 'Yönetici', 'Administrator');")
cursor.execute("UPDATE audit_logs SET description = REPLACE(description, 'görevi oluşturuldu', 'task created');")
cursor.execute("UPDATE audit_logs SET description = REPLACE(description, 'ödevi teslim edildi', 'submission uploaded');")
cursor.execute("UPDATE audit_logs SET description = REPLACE(description, 'değerlendirildi', 'evaluated & graded');")

# Clean any remaining Turkish users in users table
cursor.execute("UPDATE users SET name = 'Prof. Test Trainer Murat' WHERE name LIKE '%Test Eğitmeni%';")
cursor.execute("UPDATE users SET name = 'Prof. Ahmet Yilmaz' WHERE name LIKE '%Ahmet Yılmaz%';")
cursor.execute("UPDATE users SET name = 'Assoc. Prof. Ayse Kaya' WHERE name LIKE '%Ayşe Kaya%';")

conn.commit()
conn.close()
print("✓ Database audit logs & users cleaned!")
