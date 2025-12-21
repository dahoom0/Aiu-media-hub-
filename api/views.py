from rest_framework import viewsets, status, permissions
from rest_framework.decorators import (
    action,
    api_view,
    permission_classes,
    parser_classes,
)
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import F
from datetime import timedelta, datetime  # <-- added datetime

from .models import *
from .serializers import *

User = get_user_model()


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_staff
                or getattr(request.user, "user_type", "") == "admin"
            )
        )


# ---------------- AUTH VIEWS ---------------- #

@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "message": "Registration successful",
                "user": UserSerializer(user, context={"request": request}).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get("username")
    password = request.data.get("password")

    # allow login by email
    if username and "@" in username:
        try:
            user_obj = User.objects.get(email=username)
            username = user_obj.username
        except User.DoesNotExist:
            pass

    user = authenticate(username=username, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        profile_data = {}
        try:
            if hasattr(user, "student_profile"):
                profile_data = StudentProfileSerializer(user.student_profile).data
            elif hasattr(user, "admin_profile"):
                profile_data = AdminProfileSerializer(user.admin_profile).data
        except Exception:
            profile_data = {}

        return Response(
            {
                "user": UserSerializer(user, context={"request": request}).data,
                "profile": profile_data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            }
        )

    return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def profile(request):
    """
    GET  -> return a single MERGED object (user + profile fields)
    PATCH -> update Django User fields (and profile if present) from form-data
    """
    user = request.user

    # helper: build merged object the frontend expects
    def build_merged(u):
        user_data = UserSerializer(u, context={"request": request}).data

        profile_data = {}
        if hasattr(u, "student_profile"):
            profile_data = StudentProfileSerializer(u.student_profile).data
        elif hasattr(u, "admin_profile"):
            profile_data = AdminProfileSerializer(u.admin_profile).data

        merged = {
            **user_data,           # id, username, email, first_name, last_name, phone, profile_picture, etc.
            **profile_data,        # student_id, year, stats, etc.
            "student_profile": profile_data,  # nested copy for convenience
        }
        return merged

    # ---------- GET ----------
    if request.method == "GET":
        return Response(build_merged(user))

    # ---------- PATCH ----------
    data = request.data

    # update User basic fields directly
    if "first_name" in data:
        user.first_name = data.get("first_name") or ""
    if "last_name" in data:
        user.last_name = data.get("last_name") or ""
    if "email" in data:
        user.email = data.get("email") or user.email
    if "phone" in data:
        user.phone = data.get("phone") or ""

    # profile picture (file)
    if "profile_picture" in request.FILES:
        user.profile_picture = request.FILES["profile_picture"]

    user.save()

    # optional: update StudentProfile / AdminProfile extra fields
    if hasattr(user, "student_profile"):
        sp = user.student_profile
        if "student_id" in data:
            sp.student_id = data.get("student_id") or sp.student_id
        if "year" in data:
            sp.year = data.get("year") or sp.year
        sp.save()
    elif hasattr(user, "admin_profile"):
        ap = user.admin_profile
        if "position" in data:
            ap.position = data.get("position") or ap.position
        ap.save()

    return Response(build_merged(user))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    if not user.check_password(request.data.get("old_password")):
        return Response({"error": "Incorrect password"}, status=400)
    user.set_password(request.data.get("new_password"))
    user.save()
    return Response({"message": "Success"})


# --------------- STANDARD VIEWSETS --------------- #

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        # Users can only see/edit themselves unless they are admin
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)


class StudentProfileViewSet(viewsets.ModelViewSet):
    queryset = StudentProfile.objects.all()
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return StudentProfile.objects.all()
        return StudentProfile.objects.filter(user=self.request.user)


class AdminProfileViewSet(viewsets.ModelViewSet):
    queryset = AdminProfile.objects.all()
    serializer_class = AdminProfileSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]


# --------------- TUTORIAL LOGIC --------------- #

class TutorialViewSet(viewsets.ModelViewSet):
    queryset = Tutorial.objects.all()
    serializer_class = TutorialSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def increment_views(self, request, pk=None):
        tutorial = self.get_object()
        Tutorial.objects.filter(pk=tutorial.pk).update(views=F("views") + 1)
        tutorial.refresh_from_db(fields=["views"])
        serializer = self.get_serializer(tutorial)
        return Response(serializer.data)


class TutorialProgressViewSet(viewsets.ModelViewSet):
    queryset = TutorialProgress.objects.all()
    serializer_class = TutorialProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TutorialProgress.objects.filter(student=self.request.user)

    def create(self, request, *args, **kwargs):
        student = request.user
        tutorial_id = request.data.get("tutorial")
        progress_percentage = request.data.get("progress_percentage")
        completed = request.data.get("completed")

        if not tutorial_id:
            return Response({"error": "Tutorial ID required"}, status=400)

        tutorial = get_object_or_404(Tutorial, id=tutorial_id)

        # Update or Create
        progress_record, created = TutorialProgress.objects.update_or_create(
            student=student,
            tutorial=tutorial,
            defaults={
                "progress_percentage": progress_percentage,
                "completed": completed,
                "last_watched_at": timezone.now(),
            },
        )

        # AUTO-UPDATE STATS
        if hasattr(student, "student_profile"):
            count = TutorialProgress.objects.filter(
                student=student, completed=True
            ).count()
            StudentProfile.objects.filter(user=student).update(
                tutorials_watched=count
            )

        serializer = self.get_serializer(progress_record)
        return Response(serializer.data)


# --------------- LAB LOGIC --------------- #

class LabViewSet(viewsets.ModelViewSet):
    queryset = Lab.objects.all()
    serializer_class = LabSerializer
    permission_classes = [IsAuthenticated]


class LabBookingViewSet(viewsets.ModelViewSet):
    queryset = LabBooking.objects.all()
    serializer_class = LabBookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Admins can see all; students only see their own bookings
        if self.request.user.is_staff:
            return LabBooking.objects.all()
        return LabBooking.objects.filter(student=self.request.user)

    def perform_create(self, serializer):
        booking = serializer.save(student=self.request.user)

        # AUTO-UPDATE STATS
        if hasattr(self.request.user, "student_profile"):
            count = LabBooking.objects.filter(
                student=self.request.user
            ).count()
            StudentProfile.objects.filter(user=self.request.user).update(
                total_bookings=count
            )

    @action(detail=False, methods=["get"], url_path="available-imacs")
    def available_imacs(self, request):
        """
        Return list of available iMac numbers (1–30) for a given date + time_slot.
        Frontend can call:
            GET /lab-bookings/available-imacs/?date=YYYY-MM-DD&time_slot=09:00-11:00&lab_room=BMC%20Lab
        """
        date_str = request.query_params.get("date")
        time_slot = request.query_params.get("time_slot")
        lab_room = request.query_params.get("lab_room")

        if not date_str or not time_slot:
            return Response(
                {"detail": "date and time_slot query parameters are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Parse date
        try:
            booking_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"detail": "Invalid date format. Expected YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Resolve lab
        lab_obj = None
        if lab_room:
            try:
                lab_obj = Lab.objects.get(name=lab_room)
            except Lab.DoesNotExist:
                return Response(
                    {"detail": f'Lab "{lab_room}" not found.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            # Fallback: if only one active lab, use it
            active_labs = Lab.objects.filter(is_active=True)
            if active_labs.count() == 1:
                lab_obj = active_labs.first()

        if lab_obj is None:
            return Response(
                {"detail": "Unable to resolve lab. Provide lab_room or configure a single active lab."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Find already booked iMacs (excluding cancelled/rejected)
        booked_numbers = LabBooking.objects.filter(
            lab=lab_obj,
            booking_date=booking_date,
            time_slot=time_slot,
        ).exclude(status__in=["cancelled", "rejected"]).values_list("imac_number", flat=True)

        booked_set = set(booked_numbers)

        # We defined imac_number 1–30 in the model; use that range
        all_imacs = range(1, 31)
        available = [n for n in all_imacs if n not in booked_set]

        return Response(
            {
                "lab_room": lab_obj.name,
                "date": booking_date.isoformat(),
                "time_slot": time_slot,
                "available_imacs": available,
            }
        )


# --------------- EQUIPMENT LOGIC --------------- #

class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"])
    def checkout(self, request):
        # Allow checking out by 'equipment_id' (QR code) or 'id' (Database ID)
        eid = request.data.get("equipment_id")

        try:
            equipment = Equipment.objects.get(equipment_id=eid)
        except Equipment.DoesNotExist:
            try:
                equipment = Equipment.objects.get(id=eid)
            except Equipment.DoesNotExist:
                return Response({"error": "Equipment not found"}, status=404)

        try:
            duration = int(request.data.get("duration", 3))
        except Exception:
            duration = 3

        notes = request.data.get("notes", "")

        if equipment.quantity_available < 1:
            return Response(
                {"error": "Item is currently out of stock"}, status=400
            )

        EquipmentRental.objects.create(
            student=request.user,
            equipment=equipment,
            rental_date=timezone.now(),
            expected_return_date=timezone.now() + timedelta(days=duration),
            status="active",
            notes=notes,
        )

        equipment.quantity_available -= 1
        if equipment.quantity_available == 0:
            equipment.status = "rented"
        equipment.save()

        # AUTO-UPDATE STATS
        if hasattr(request.user, "student_profile"):
            count = EquipmentRental.objects.filter(
                student=request.user, status="active"
            ).count()
            StudentProfile.objects.filter(user=request.user).update(
                active_rentals=count
            )

        return Response({"message": "Success"})


class EquipmentRentalViewSet(viewsets.ModelViewSet):
    queryset = EquipmentRental.objects.all()
    serializer_class = EquipmentRentalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return EquipmentRental.objects.all()
        return EquipmentRental.objects.filter(student=self.request.user)

    @action(detail=True, methods=["post"])
    def return_item(self, request, pk=None):
        rental = self.get_object()

        if rental.status == "returned":
            return Response({"message": "Already returned"})

        rental.status = "returned"
        rental.actual_return_date = timezone.now()
        rental.returned_to = request.user
        rental.save()

        equipment = rental.equipment
        equipment.quantity_available += 1
        if equipment.quantity_available > 0:
            equipment.status = "available"
        equipment.save()

        # AUTO-UPDATE STATS
        if hasattr(request.user, "student_profile"):
            count = EquipmentRental.objects.filter(
                student=request.user, status="active"
            ).count()
            StudentProfile.objects.filter(user=request.user).update(
                active_rentals=count
            )

        return Response(EquipmentRentalSerializer(rental).data)


# --------------- CV LOGIC --------------- #

class CVViewSet(viewsets.ModelViewSet):
    queryset = CV.objects.all()
    serializer_class = CVSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        if self.request.user.is_staff:
            return CV.objects.all()
        return CV.objects.filter(student=self.request.user)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class BaseCVItemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        cv = get_object_or_404(CV, student=self.request.user)
        serializer.save(cv=cv)


class EducationViewSet(BaseCVItemViewSet):
    queryset = Education.objects.all()
    serializer_class = EducationSerializer

    def get_queryset(self):
        return Education.objects.filter(cv__student=self.request.user)


class ExperienceViewSet(BaseCVItemViewSet):
    queryset = Experience.objects.all()
    serializer_class = ExperienceSerializer

    def get_queryset(self):
        return Experience.objects.filter(cv__student=self.request.user)


class ProjectViewSet(BaseCVItemViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def get_queryset(self):
        return Project.objects.filter(cv__student=self.request.user)


class SkillViewSet(BaseCVItemViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer

    def get_queryset(self):
        return Skill.objects.filter(cv__student=self.request.user)


class CertificationViewSet(BaseCVItemViewSet):
    queryset = Certification.objects.all()
    serializer_class = CertificationSerializer

    def get_queryset(self):
        return Certification.objects.filter(cv__student=self.request.user)


class InvolvementViewSet(BaseCVItemViewSet):
    queryset = Involvement.objects.all()
    serializer_class = InvolvementSerializer

    def get_queryset(self):
        return Involvement.objects.filter(cv__student=self.request.user)


class ReferenceViewSet(BaseCVItemViewSet):
    queryset = Reference.objects.all()
    serializer_class = ReferenceSerializer

    def get_queryset(self):
        return Reference.objects.filter(cv__student=self.request.user)


# NEW: Languages & Awards ViewSets for CV

class LanguageViewSet(BaseCVItemViewSet):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer

    def get_queryset(self):
        return Language.objects.filter(cv__student=self.request.user)


class AwardViewSet(BaseCVItemViewSet):
    queryset = Award.objects.all()
    serializer_class = AwardSerializer

    def get_queryset(self):
        return Award.objects.filter(cv__student=self.request.user)
