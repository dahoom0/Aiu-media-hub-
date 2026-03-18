"""
Management command to create missing StudentProfile and AdminProfile records
for users who were registered but don't have profiles.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import models
from api.models import StudentProfile, AdminProfile
import time

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates missing StudentProfile and AdminProfile records for existing users'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Checking for users without profiles...'))
        
        # Fix students without profiles
        students_without_profiles = User.objects.filter(
            user_type='student',
            student_profile__isnull=True
        )
        
        student_count = 0
        for user in students_without_profiles:
            try:
                # Use username as fallback for student_id
                student_id = user.username
                
                # Check if student_id already exists
                if StudentProfile.objects.filter(student_id=student_id).exists():
                    # Use username + timestamp if duplicate
                    student_id = f"{user.username}_{int(time.time())}"
                
                StudentProfile.objects.create(
                    user=user,
                    student_id=student_id,
                    year='1',
                    program='Bachelor of Media & Communication'
                )
                student_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created StudentProfile for {user.username} (ID: {student_id})')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Failed to create StudentProfile for {user.username}: {str(e)}')
                )
        
        # Fix admins without profiles
        admins_without_profiles = User.objects.filter(
            student_profile__isnull=True,
            admin_profile__isnull=True
        ).filter(
            models.Q(user_type='admin') | models.Q(is_staff=True)
        )
        
        admin_count = 0
        for user in admins_without_profiles:
            try:
                admin_id = user.username
                
                # Check if admin_id already exists
                if AdminProfile.objects.filter(admin_id=admin_id).exists():
                    admin_id = f"{user.username}_{int(time.time())}"
                
                AdminProfile.objects.create(
                    user=user,
                    admin_id=admin_id,
                    role='Administrator' if user.is_superuser else 'Staff',
                    status='active'
                )
                admin_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created AdminProfile for {user.username} (ID: {admin_id})')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Failed to create AdminProfile for {user.username}: {str(e)}')
                )
        
        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('========================================'))
        self.stdout.write(self.style.SUCCESS(f'Created {student_count} StudentProfile(s)'))
        self.stdout.write(self.style.SUCCESS(f'Created {admin_count} AdminProfile(s)'))
        self.stdout.write(self.style.SUCCESS('========================================'))
        
        if student_count == 0 and admin_count == 0:
            self.stdout.write(self.style.SUCCESS('All users already have profiles!'))
