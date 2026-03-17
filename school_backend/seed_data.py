"""
Run with: python manage.py shell < seed_data.py
Creates sample admin, teachers, students, grades and classes.
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_backend.settings')
django.setup()

from users.models import CustomUser, StudentProfile, TeacherProfile
from academics.models import Grade, ClassRoom

print("🌱 Seeding database...")

# ── Admin ─────────────────────────────────────────────────────
admin, _ = CustomUser.objects.get_or_create(
    email='admin@school.edu',
    defaults={
        'username': 'admin',
        'first_name': 'Dr. Khaled',
        'last_name': 'Ibrahim',
        'role': 'admin',
        'is_staff': True,
        'is_superuser': True,
    }
)
admin.set_password('Admin@123')
admin.save()
print(f"  ✅ Admin: admin@school.edu / Admin@123")

# ── Teachers ──────────────────────────────────────────────────
teachers_data = [
    ('Ahmed', 'Mostafa', 'teacher1@school.edu', 'Mathematics'),
    ('Mona', 'Adel', 'teacher2@school.edu', 'Science'),
    ('Nada', 'Ibrahim', 'teacher3@school.edu', 'Arabic'),
]
teachers = []
for fn, ln, email, subject in teachers_data:
    t, _ = CustomUser.objects.get_or_create(
        email=email,
        defaults={'username': email.split('@')[0], 'first_name': fn, 'last_name': ln, 'role': 'teacher'}
    )
    t.set_password('Teacher@123')
    t.save()
    TeacherProfile.objects.get_or_create(user=t, defaults={'subject': subject})
    teachers.append(t)
    print(f"  ✅ Teacher: {email} / Teacher@123")

# ── Grades & Classes ──────────────────────────────────────────
grade1, _ = Grade.objects.get_or_create(name='Grade 1')
grade2, _ = Grade.objects.get_or_create(name='Grade 2')
grade3, _ = Grade.objects.get_or_create(name='Grade 3')

class1a, _ = ClassRoom.objects.get_or_create(grade=grade1, name='1-A', defaults={'teacher': teachers[0], 'subject': 'Mathematics'})
class1b, _ = ClassRoom.objects.get_or_create(grade=grade1, name='1-B', defaults={'teacher': teachers[1], 'subject': 'Science'})
class2a, _ = ClassRoom.objects.get_or_create(grade=grade2, name='2-A', defaults={'teacher': teachers[2], 'subject': 'Arabic'})
class3a, _ = ClassRoom.objects.get_or_create(grade=grade3, name='3-A', defaults={'teacher': teachers[0], 'subject': 'Mathematics'})
print("  ✅ Grades & Classes created")

# ── Students ──────────────────────────────────────────────────
students_data = [
    ('Ahmed', 'Samir', 'student1@school.edu', class1a),
    ('Sara', 'Hassan', 'student2@school.edu', class1a),
    ('Omar', 'Khalil', 'student3@school.edu', class2a),
    ('Nada', 'Ali', 'student4@school.edu', class3a),
    ('Youssef', 'Adel', 'student5@school.edu', class3a),
]
for fn, ln, email, classroom in students_data:
    s, _ = CustomUser.objects.get_or_create(
        email=email,
        defaults={'username': email.split('@')[0], 'first_name': fn, 'last_name': ln, 'role': 'student'}
    )
    s.set_password('Student@123')
    s.save()
    StudentProfile.objects.get_or_create(user=s, defaults={'class_room': classroom})
    print(f"  ✅ Student: {email} / Student@123")

print("\n🎉 Done! Sample accounts created.")
print("=" * 40)
print("Admin    → admin@school.edu    / Admin@123")
print("Teacher  → teacher1@school.edu / Teacher@123")
print("Student  → student1@school.edu / Student@123")
