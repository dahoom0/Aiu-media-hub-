from datetime import datetime
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import *

User = get_user_model()


# ---------------- USERS / PROFILES ---------------- #

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
                year=year or '1',
            )
        return user


# ---------------- TUTORIALS ---------------- #

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

    def validate_video_url(self, value):
        if not value:
            raise serializers.ValidationError("A video URL is required for YouTube tutorials.")
        if not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError("Please enter a valid URL.")
        return value

    def validate_duration(self, value):
        try:
            return int(value)
        except (ValueError, TypeError):
            raise serializers.ValidationError("Duration must be a number (minutes).")

    def create(self, validated_data):
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

    def validate_progress_percentage(self, value):
        try:
            v = int(value)
        except (ValueError, TypeError):
            raise serializers.ValidationError("Progress percentage must be a number.")
        if v < 0 or v > 100:
            raise serializers.ValidationError("Progress percentage must be between 0 and 100.")
        return v

    def validate(self, attrs):
        progress = attrs.get('progress_percentage', None)
        completed = attrs.get('completed', None)

        if progress is not None:
            try:
                progress = int(progress)
            except (ValueError, TypeError):
                raise serializers.ValidationError({"progress_percentage": "Progress percentage must be a number."})

        if completed is True:
            attrs['progress_percentage'] = 100

        if progress is not None and progress >= 95:
            attrs['completed'] = True
            attrs['progress_percentage'] = 100

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user and request.user.is_authenticated:
            validated_data['student'] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('student', None)
        return super().update(instance, validated_data)


# ---------------- LABS ---------------- #

class LabSerializer(serializers.ModelSerializer):
    facilities_list = serializers.SerializerMethodField()

    class Meta:
        model = Lab
        fields = '__all__'

    def get_facilities_list(self, obj):
        return [f.strip() for f in obj.facilities.split(',')] if obj.facilities else []


class LabBookingSerializer(serializers.ModelSerializer):
    lab = serializers.PrimaryKeyRelatedField(queryset=Lab.objects.all(), required=False, allow_null=True)
    booking_date = serializers.DateField(required=False, allow_null=True)
    start_time = serializers.TimeField(required=False, allow_null=True)
    end_time = serializers.TimeField(required=False, allow_null=True)
    time_slot = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    # frontend helper inputs
    lab_room = serializers.CharField(write_only=True, required=False, allow_blank=True)
    date = serializers.DateField(write_only=True, required=False, allow_null=True)

    # read-only helpers
    lab_name = serializers.CharField(source='lab.name', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_profile.student_id', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)

    class Meta:
        model = LabBooking
        fields = '__all__'
        read_only_fields = ['student', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at']

    def _parse_time_slot(self, time_slot: str):
        try:
            start_str, end_str = time_slot.split('-')
            start_time = datetime.strptime(start_str.strip(), '%H:%M').time()
            end_time = datetime.strptime(end_str.strip(), '%H:%M').time()
        except Exception:
            raise serializers.ValidationError({"time_slot": 'Invalid time slot format. Use "HH:MM-HH:MM".'})
        return start_time, end_time

    def validate(self, attrs):
        """
        ✅ IMPORTANT:
        - On CREATE: require lab_room/date/time_slot and compute start/end
        - On PATCH (partial update): do NOT require time_slot unless the client sends it
        """
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None
        initial = getattr(self, 'initial_data', {}) or {}

        creating = self.instance is None

        # Track whether date/time_slot are being set in this request
        date_touched = creating or ('booking_date' in attrs) or ('date' in attrs) or ('date' in initial)
        time_slot_touched = creating or ('time_slot' in attrs) or ('time_slot' in initial)

        # ---------------- DATE ----------------
        if date_touched:
            date_value = attrs.get('booking_date')

            if not date_value:
                if 'date' in attrs and attrs.get('date'):
                    date_value = attrs.get('date')
                elif initial.get('date'):
                    try:
                        date_value = datetime.strptime(str(initial['date']), '%Y-%m-%d').date()
                    except Exception:
                        raise serializers.ValidationError({"date": "Invalid format. Use YYYY-MM-DD."})

            if creating and not date_value:
                raise serializers.ValidationError({"date": "This field is required."})

            if date_value:
                attrs['booking_date'] = date_value

        # ---------------- LAB ----------------
        if creating or ('lab' in attrs) or ('lab_room' in attrs) or ('lab_room' in initial):
            lab_obj = attrs.get('lab')
            lab_room_value = attrs.get('lab_room') or initial.get('lab_room')

            if not lab_obj and lab_room_value:
                lab_obj = Lab.objects.filter(name=lab_room_value).first()

            if creating and not lab_obj:
                raise serializers.ValidationError({"lab_room": "Lab is required (lab_room or lab id)."})

            if lab_obj:
                attrs['lab'] = lab_obj

        # ---------------- TIME SLOT -> START/END ----------------
        incoming_time_slot = attrs.get('time_slot') or initial.get('time_slot')

        if creating:
            if not incoming_time_slot:
                raise serializers.ValidationError({"time_slot": "This field is required."})
            start_time, end_time = self._parse_time_slot(incoming_time_slot)
            attrs['time_slot'] = incoming_time_slot
            attrs['start_time'] = start_time
            attrs['end_time'] = end_time
        else:
            if time_slot_touched:
                if not incoming_time_slot:
                    raise serializers.ValidationError({"time_slot": "Invalid time slot."})
                start_time, end_time = self._parse_time_slot(incoming_time_slot)
                attrs['time_slot'] = incoming_time_slot
                attrs['start_time'] = start_time
                attrs['end_time'] = end_time

        # ✅ NEW: Prevent booking past time slots
        # - block booking_date in the past
        # - if booking_date is today, block time_slot that already started/passed
        if creating or date_touched or time_slot_touched:
            booking_date = attrs.get('booking_date') or (getattr(self.instance, 'booking_date', None) if self.instance else None)

            # Determine start_time for comparison (from attrs if parsed, else from instance)
            st = attrs.get('start_time') or (getattr(self.instance, 'start_time', None) if self.instance else None)

            if booking_date:
                now = timezone.localtime(timezone.now())
                today = now.date()

                if booking_date < today:
                    raise serializers.ValidationError({"date": "Cannot book a past date."})

                if booking_date == today:
                    if st:
                        try:
                            slot_start_dt = datetime.combine(booking_date, st)
                            slot_start_dt = timezone.make_aware(slot_start_dt, timezone.get_current_timezone())
                            if slot_start_dt <= now:
                                raise serializers.ValidationError({"time_slot": "Cannot book a past time slot."})
                        except serializers.ValidationError:
                            raise
                        except Exception:
                            # if anything fails, be safe and block rather than allowing past booking
                            raise serializers.ValidationError({"time_slot": "Cannot book a past time slot."})

        # bind student on create
        if creating and not attrs.get('student') and user:
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


# ---------------- EQUIPMENT ---------------- #

class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = '__all__'
        read_only_fields = ['qr_code', 'created_at', 'updated_at']


class EquipmentRentalSerializer(serializers.ModelSerializer):
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)
    equipment_id = serializers.CharField(source='equipment.equipment_id', read_only=True)

    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_profile.student_id', read_only=True)
    student_email = serializers.EmailField(source='student.email', read_only=True)

    user = UserSerializer(source='student', read_only=True)

    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)

    class Meta:
        model = EquipmentRental
        fields = '__all__'
        read_only_fields = [
            'student',
            'issued_by',
            'returned_to',
            'reviewed_by',
            'reviewed_at',
            'created_at',
            'updated_at',
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user and request.user.is_authenticated:
            validated_data['student'] = request.user
        return super().create(validated_data)


# ---------------- CV (unchanged) ---------------- #

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
