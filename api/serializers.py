from datetime import datetime
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import *

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'user_type',
            'phone',
            'profile_picture',
        ]
        read_only_fields = ['id']

class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = '__all__'
        read_only_fields = ['user']

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
        fields = [
            'username',
            'email',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
            'phone',
            'user_type',
            'student_id',
            'year',
        ]

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match")
        if data.get('user_type') == 'student' and not data.get('student_id'):
            raise serializers.ValidationError(
                "Student ID is required for student accounts"
            )
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
                year=year or '1',
            )
        return user

class CategorySerializer(serializers.ModelSerializer):
    tutorial_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = '__all__'

    def get_tutorial_count(self, obj):
        return obj.tutorials.filter(is_active=True).count()

# --- TUTORIAL FIXES (YOUTUBE FOCUS) ---
class TutorialSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    created_by_name = serializers.CharField(
        source='created_by.get_full_name', read_only=True
    )

    class Meta:
        model = Tutorial
        # Using __all__ is fine, but video_url is our priority for YouTube
        fields = '__all__'
        read_only_fields = ['views', 'created_by', 'created_at', 'updated_at']

    def validate_video_url(self, value):
        """
        Ensure the URL is a valid link. 
        Note: You could add regex here to enforce youtube.com/watch?v= if needed.
        """
        if not value:
            raise serializers.ValidationError("A video URL is required for YouTube tutorials.")
        if not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError("Please enter a valid URL.")
        return value

    def validate_duration(self, value):
        """
        Converts any incoming value to an integer representing minutes.
        """
        try:
            return int(value)
        except (ValueError, TypeError):
            raise serializers.ValidationError("Duration must be a number (minutes).")

    def create(self, validated_data):
        """
        Automatically link the tutorial to the logged-in admin.
        """
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)

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
    lab = serializers.PrimaryKeyRelatedField(
        queryset=Lab.objects.all(),
        required=False,
        allow_null=True,
    )
    booking_date = serializers.DateField(required=False, allow_null=True)
    start_time = serializers.TimeField(required=False, allow_null=True)
    end_time = serializers.TimeField(required=False, allow_null=True)
    time_slot = serializers.CharField(required=False)
    lab_room = serializers.CharField(write_only=True, required=False)
    date = serializers.DateField(write_only=True, required=False)
    lab_name = serializers.CharField(source='lab.name', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.CharField(
        source='student.student_profile.student_id', read_only=True
    )
    reviewed_by_name = serializers.CharField(
        source='reviewed_by.get_full_name', read_only=True
    )

    class Meta:
        model = LabBooking
        fields = '__all__'
        read_only_fields = [
            'student',
            'reviewed_by',
            'reviewed_at',
            'created_at',
            'updated_at',
        ]

    def _parse_time_slot(self, time_slot: str):
        try:
            start_str, end_str = time_slot.split('-')
            start_time = datetime.strptime(start_str.strip(), '%H:%M').time()
            end_time = datetime.strptime(end_str.strip(), '%H:%M').time()
        except Exception:
            raise serializers.ValidationError({
                "time_slot": 'Invalid time slot format. Use "HH:MM-HH:MM".'
            })
        return start_time, end_time

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None
        initial = getattr(self, 'initial_data', {}) or {}
        date_value = attrs.get('booking_date')
        if not date_value:
            if 'date' in attrs:
                date_value = attrs.get('date')
            elif 'date' in initial:
                try:
                    date_value = datetime.strptime(initial['date'], '%Y-%m-%d').date()
                except Exception:
                    raise serializers.ValidationError({"date": "Invalid format."})
        attrs['booking_date'] = date_value
        lab_obj = attrs.get('lab')
        lab_room_value = attrs.get('lab_room') or initial.get('lab_room')
        if not lab_obj and lab_room_value:
            lab_obj = Lab.objects.filter(name=lab_room_value).first()
        attrs['lab'] = lab_obj
        time_slot = attrs.get('time_slot') or initial.get('time_slot')
        start_time, end_time = self._parse_time_slot(time_slot)
        attrs['time_slot'] = time_slot
        attrs['start_time'] = start_time
        attrs['end_time'] = end_time
        if not attrs.get('student') and user:
            attrs['student'] = user
        return attrs

    def create(self, validated_data):
        validated_data.pop('lab_room', None)
        validated_data.pop('date', None)
        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['lab_room'] = instance.lab.name if instance.lab else None
        data['date'] = instance.booking_date.isoformat() if instance.booking_date else None
        return data

class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = '__all__'
        read_only_fields = ['qr_code', 'created_at', 'updated_at']

class EquipmentRentalSerializer(serializers.ModelSerializer):
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)

    class Meta:
        model = EquipmentRental
        fields = '__all__'
        read_only_fields = ['student', 'issued_by', 'created_at']

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

class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = '__all__'
        read_only_fields = ['cv']

class AwardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Award
        fields = '__all__'
        read_only_fields = ['cv']

class CVSerializer(serializers.ModelSerializer):
    education = EducationSerializer(many=True, read_only=True)
    experience = ExperienceSerializer(many=True, read_only=True)
    projects = ProjectSerializer(many=True, read_only=True)
    skills = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = CV
        fields = '__all__'
        read_only_fields = ['student', 'reviewed_by', 'created_at']