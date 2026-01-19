from datetime import datetime
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
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
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None
        initial = getattr(self, 'initial_data', {}) or {}

        creating = self.instance is None

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

        # ✅ Prevent booking past time slots
        if creating or date_touched or time_slot_touched:
            booking_date = attrs.get('booking_date') or (getattr(self.instance, 'booking_date', None) if self.instance else None)
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
                            raise serializers.ValidationError({"time_slot": "Cannot book a past time slot."})

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

class EquipmentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentCategory
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class EquipmentSerializer(serializers.ModelSerializer):
    # ✅ read-only categories objects
    categories = EquipmentCategorySerializer(many=True, read_only=True)

    # ✅ write-only list of category IDs (M2M) - require at least one on create
    category_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=EquipmentCategory.objects.all(),
        write_only=True,
        required=False
    )

    # ✅ legacy model field (CharField choices) - make optional in API
    category = serializers.CharField(required=False, allow_blank=True)

    # ✅ computed fields (read-only)
    rented_units = serializers.SerializerMethodField()
    rentable_quantity = serializers.SerializerMethodField()
    computed_available = serializers.SerializerMethodField()

    class Meta:
        model = Equipment
        fields = '__all__'
        read_only_fields = [
            'qr_code',
            'created_at',
            'updated_at',
            'quantity_available',
            'rented_units',
            'rentable_quantity',
            'computed_available',
        ]

    def _derive_legacy_category(self, category_objs):
        """
        Convert selected EquipmentCategory names -> Equipment.category choices,
        so old required field won't block create.
        """
        names = [str(getattr(c, "name", "") or "").lower() for c in (category_objs or [])]

        for n in names:
            if 'camera' in n:
                return 'camera'
            if 'audio' in n or 'mic' in n:
                return 'audio'
            if 'light' in n:
                return 'lighting'
            if 'access' in n:
                return 'accessories'
        return 'other'

    def get_rented_units(self, obj):
        try:
            return int(obj.rented_units())
        except Exception:
            return 0

    def get_computed_available(self, obj):
        try:
            return int(obj.computed_available)
        except Exception:
            return 0

    def get_rentable_quantity(self, obj):
        try:
            return int(obj.rentable_quantity)
        except Exception:
            return 0

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)

        # keep existing values when partial update
        total = attrs.get('quantity_total', instance.quantity_total if instance else 0)
        maint = attrs.get('quantity_under_maintenance', instance.quantity_under_maintenance if instance else 0)

        try:
            total = int(total)
            maint = int(maint)
        except Exception:
            raise serializers.ValidationError("Quantity fields must be integers.")

        if total < 0:
            raise serializers.ValidationError({"quantity_total": "Cannot be negative."})
        if maint < 0:
            raise serializers.ValidationError({"quantity_under_maintenance": "Cannot be negative."})

        rented = instance.rented_units() if instance else 0
        available_now = max(total - int(rented), 0)

        if total < int(rented):
            raise serializers.ValidationError({
                "quantity_total": f"Total cannot be less than currently rented units ({rented})."
            })

        if maint > available_now:
            raise serializers.ValidationError({
                "quantity_under_maintenance": (
                    f"Under maintenance cannot exceed available (not rented) units ({available_now})."
                )
            })

        # ✅ require at least one category on create (or if no existing categories)
        incoming_cat_ids = attrs.get('category_ids', None)
        if instance is None:
            if incoming_cat_ids is None or len(incoming_cat_ids) == 0:
                raise serializers.ValidationError({"category_ids": "Select at least one category."})

        return attrs

    def create(self, validated_data):
        category_ids = validated_data.pop('category_ids', [])
        validated_data.pop('quantity_available', None)  # ignore read-only

        # ✅ auto-fill old required field if missing
        if not validated_data.get('category'):
            validated_data['category'] = self._derive_legacy_category(category_ids)

        obj = super().create(validated_data)

        if category_ids is not None:
            obj.categories.set(category_ids)

        obj.save()  # triggers model auto-sync logic
        return obj

    def update(self, instance, validated_data):
        category_ids = validated_data.pop('category_ids', None)
        validated_data.pop('quantity_available', None)  # ignore read-only

        # ✅ if categories were sent and legacy category not sent, derive it
        if category_ids is not None and not validated_data.get('category'):
            validated_data['category'] = self._derive_legacy_category(category_ids)

        obj = super().update(instance, validated_data)

        if category_ids is not None:
            obj.categories.set(category_ids)

        obj.save()
        return obj


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


class EquipmentRequestItemSerializer(serializers.ModelSerializer):
    equipment = serializers.PrimaryKeyRelatedField(queryset=Equipment.objects.all(), required=False)
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)
    equipment_code = serializers.CharField(source='equipment.equipment_id', read_only=True)

    student_name = serializers.CharField(source='request.student.get_full_name', read_only=True)
    student_id = serializers.CharField(source='request.student.student_profile.student_id', read_only=True)

    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)

    rental_id = serializers.SerializerMethodField()

    class Meta:
        model = EquipmentRequestItem
        fields = '__all__'
        read_only_fields = [
            'request',
            'status',
            'reviewed_by',
            'reviewed_at',
            'reject_reason',
            'rental',
            'created_at',
            'updated_at',
        ]

    def get_rental_id(self, obj):
        try:
            return obj.rental.id if obj.rental else None
        except Exception:
            return None


class EquipmentRequestCreateItemSerializer(serializers.Serializer):
    equipment_id = serializers.PrimaryKeyRelatedField(queryset=Equipment.objects.all())
    quantity = serializers.IntegerField(min_value=1)
    duration_days = serializers.IntegerField(min_value=1)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class EquipmentRequestSerializer(serializers.ModelSerializer):
    items = EquipmentRequestItemSerializer(many=True, read_only=True)
    cart_items = EquipmentRequestCreateItemSerializer(many=True, write_only=True)

    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_profile.student_id', read_only=True)

    class Meta:
        model = EquipmentRequest
        fields = '__all__'
        read_only_fields = ['student', 'status', 'created_at', 'updated_at']

    def validate(self, attrs):
        cart_items = attrs.get('cart_items', [])
        if not cart_items:
            raise serializers.ValidationError({"cart_items": "Cart is empty."})
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None

        cart_items = validated_data.pop('cart_items', [])
        notes = validated_data.get('notes', None)

        merged = {}
        for row in cart_items:
            eq = row['equipment_id']
            key = str(eq.pk)

            if key not in merged:
                merged[key] = {
                    'equipment': eq,
                    'quantity': int(row.get('quantity', 1)),
                    'duration_days': int(row.get('duration_days', 1)),
                    'notes': row.get('notes', None),
                }
            else:
                merged[key]['quantity'] += int(row.get('quantity', 1))
                merged[key]['duration_days'] = max(
                    merged[key]['duration_days'],
                    int(row.get('duration_days', 1))
                )

        with transaction.atomic():
            req_obj = EquipmentRequest.objects.create(
                student=user,
                status='pending',
                notes=notes
            )

            items = []
            for v in merged.values():
                items.append(
                    EquipmentRequestItem(
                        request=req_obj,
                        equipment=v['equipment'],
                        quantity=v['quantity'],
                        duration_days=v['duration_days'],
                        notes=v.get('notes', None),
                        status='pending'
                    )
                )

            EquipmentRequestItem.objects.bulk_create(items)

        return req_obj


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
