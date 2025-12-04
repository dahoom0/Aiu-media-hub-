from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import *

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'user_type', 'phone', 'profile_picture']
        read_only_fields = ['id']

class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentProfile
        fields = '__all__'
        read_only_fields = ['total_bookings', 'active_rentals', 'tutorials_watched']
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()

class AdminProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminProfile
        fields = '__all__'
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    student_id = serializers.CharField(required=False, allow_blank=True)
    year = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'phone', 'user_type', 'student_id', 'year']
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match")
        if data.get('user_type') == 'student' and not data.get('student_id'):
            raise serializers.ValidationError("Student ID is required for student accounts")
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        student_id = validated_data.pop('student_id', None)
        year = validated_data.pop('year', None)
        user = User.objects.create_user(**validated_data)
        if user.user_type == 'student':
            StudentProfile.objects.create(
                user=user,
                student_id=student_id,
                year=year or '1'
            )
        return user

class CategorySerializer(serializers.ModelSerializer):
    tutorial_count = serializers.SerializerMethodField()
    class Meta:
        model = Category
        fields = '__all__'
    def get_tutorial_count(self, obj):
        return obj.tutorials.filter(is_active=True).count()

class TutorialSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    class Meta:
        model = Tutorial
        fields = '__all__'
        read_only_fields = ['views', 'created_by', 'created_at', 'updated_at']

class TutorialProgressSerializer(serializers.ModelSerializer):
    tutorial_title = serializers.CharField(source='tutorial.title', read_only=True)
    class Meta:
        model = TutorialProgress
        fields = '__all__'
        read_only_fields = ['student']

class LabSerializer(serializers.ModelSerializer):
    facilities_list = serializers.SerializerMethodField()
    class Meta:
        model = Lab
        fields = '__all__'
    def get_facilities_list(self, obj):
        return [f.strip() for f in obj.facilities.split(',')] if obj.facilities else []

class LabBookingSerializer(serializers.ModelSerializer):
    lab_name = serializers.CharField(source='lab.name', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_profile.student_id', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    class Meta:
        model = LabBooking
        fields = '__all__'
        read_only_fields = ['student', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at']

class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = '__all__'
        read_only_fields = ['qr_code', 'created_at', 'updated_at']

class EquipmentRentalSerializer(serializers.ModelSerializer):
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)
    equipment_id = serializers.CharField(source='equipment.equipment_id', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    issued_by_name = serializers.CharField(source='issued_by.get_full_name', read_only=True)
    class Meta:
        model = EquipmentRental
        fields = '__all__'
        read_only_fields = ['student', 'issued_by', 'returned_to', 'created_at', 'updated_at']

# --- CV SERIALIZERS (UPDATED) ---

class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = '__all__'
        read_only_fields = ['cv']

class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = '__all__'
        read_only_fields = ['cv']

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['cv']

class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = '__all__'
        read_only_fields = ['cv']

class InvolvementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Involvement
        fields = '__all__'
        read_only_fields = ['cv']

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'
        read_only_fields = ['cv']

class ReferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reference
        fields = '__all__'
        read_only_fields = ['cv']

class CVSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_profile.student_id', read_only=True)
    student_email = serializers.EmailField(source='student.email', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    
    education = EducationSerializer(many=True, read_only=True)
    experience = ExperienceSerializer(many=True, read_only=True)
    projects = ProjectSerializer(many=True, read_only=True)
    certifications = CertificationSerializer(many=True, read_only=True)
    involvement = InvolvementSerializer(many=True, read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    references = ReferenceSerializer(many=True, read_only=True)
    
    class Meta:
        model = CV
        fields = '__all__'
        # Added 'student' to read_only fields
        read_only_fields = ['student', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at']