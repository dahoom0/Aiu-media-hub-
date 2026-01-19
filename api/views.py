from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth import authenticate, get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import HttpResponse

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import F, Q
from django.db import transaction

from datetime import timedelta, datetime, date
import csv
import re

from io import BytesIO

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


def _is_admin(user) -> bool:
    return bool(user and user.is_authenticated and (user.is_staff or getattr(user, "user_type", "") == "admin"))


def _get_equipment_available_units(equipment) -> int:
    """
    ✅ Stock rule: do NOT manually force quantity_available.
    Prefer model-computed availability if present.
    """
    for attr in ("computed_available", "rentable_quantity", "quantity_available"):
        try:
            v = getattr(equipment, attr, None)
            if v is None:
                continue
            return int(v)
        except Exception:
            continue
    return 0


def _equipment_sync(equipment):
    """
    ✅ Call model's internal sync logic by saving.
    Never manually decrement/increment quantity_available.
    """
    try:
        equipment.save()
    except Exception:
        # last resort: refresh then save (some implementations require fresh state)
        try:
            equipment.refresh_from_db()
            equipment.save()
        except Exception:
            pass


def _model_has_field(model_obj, field_name: str) -> bool:
    try:
        return any(f.name == field_name for f in model_obj._meta.get_fields())
    except Exception:
        return False


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

    def build_merged(u):
        user_data = UserSerializer(u, context={"request": request}).data

        profile_data = {}
        if hasattr(u, "student_profile"):
            profile_data = StudentProfileSerializer(u.student_profile).data
        elif hasattr(u, "admin_profile"):
            profile_data = AdminProfileSerializer(u.admin_profile).data

        merged = {
            **user_data,
            **profile_data,
            "student_profile": profile_data,
        }
        return merged

    if request.method == "GET":
        return Response(build_merged(user))

    data = request.data

    if "first_name" in data:
        user.first_name = data.get("first_name") or ""
    if "last_name" in data:
        user.last_name = data.get("last_name") or ""
    if "email" in data:
        user.email = data.get("email") or user.email
    if "phone" in data:
        user.phone = data.get("phone") or ""

    if "profile_picture" in request.FILES:
        user.profile_picture = request.FILES["profile_picture"]

    user.save()

    if hasattr(user, "student_profile"):
        sp = user.student_profile
        if "student_id" in data:
            sp.student_id = data.get("student_id") or sp.student_id
        if "year" in data:
            sp.year = data.get("year") or sp.year
        sp.save()
    elif hasattr(user, "admin_profile"):
        ap = user.admin_profile
        if "role" in data:
            ap.role = data.get("role") or ap.role
        if "department" in data:
            ap.department = data.get("department") or ap.department
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
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)


class StudentProfileViewSet(viewsets.ModelViewSet):
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = StudentProfile.objects.select_related("user")

        if _is_admin(user):
            return qs.all()

        return qs.filter(user=user)


class AdminProfileViewSet(viewsets.ModelViewSet):
    serializer_class = AdminProfileSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        return AdminProfile.objects.select_related("user").all()


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

    def _safe_filename(self, s: str) -> str:
        s = (s or "").strip()
        if not s:
            return "tutorial"
        s = re.sub(r"[^a-zA-Z0-9_\-]+", "_", s)
        return s[:60] or "tutorial"

    def _get_student_full_name(self, user_obj) -> str:
        if not user_obj:
            return "N/A"
        try:
            full = (user_obj.get_full_name() or "").strip()
            if full:
                return full
        except Exception:
            pass
        sp = getattr(user_obj, "student_profile", None)
        if sp:
            for attr in ("full_name", "name", "student_name"):
                try:
                    v = getattr(sp, attr, None)
                    if v and str(v).strip():
                        return str(v).strip()
                except Exception:
                    continue
        try:
            return (user_obj.username or "N/A").strip() or "N/A"
        except Exception:
            return "N/A"

    @action(detail=True, methods=["get"], url_path="completed-export", permission_classes=[IsAuthenticated, IsAdminUser])
    def completed_export(self, request, pk=None):
        tutorial = self.get_object()

        progress_records = (
            TutorialProgress.objects.filter(tutorial=tutorial, completed=True)
            .select_related("student", "student__student_profile")
            .order_by("-last_watched_at", "-id")
        )

        response = HttpResponse(content_type="text/csv")
        safe_title = self._safe_filename(getattr(tutorial, "title", "") or "")
        filename = f"{safe_title}_{tutorial.id}_completions.csv"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        writer.writerow(["Student ID", "Full Name", "Completed DateTime", "Status"])

        for p in progress_records:
            student_user = getattr(p, "student", None)

            student_id = "N/A"
            if student_user and hasattr(student_user, "student_profile"):
                try:
                    sid = getattr(student_user.student_profile, "student_id", None)
                    if sid:
                        student_id = str(sid)
                except Exception:
                    pass

            full_name = self._get_student_full_name(student_user)

            completed_dt = getattr(p, "last_watched_at", None)
            if completed_dt:
                try:
                    if timezone.is_naive(completed_dt):
                        completed_dt = timezone.make_aware(
                            completed_dt, timezone.get_current_timezone()
                        )
                except Exception:
                    pass
                try:
                    completed_str = completed_dt.astimezone(
                        timezone.get_current_timezone()
                    ).strftime("%Y-%m-%d %H:%M:%S")
                except Exception:
                    completed_str = str(completed_dt)
            else:
                completed_str = "N/A"

            backend_status = "completed" if getattr(p, "completed", False) else "in_progress"

            writer.writerow([student_id, full_name, completed_str, backend_status])

        return response


class TutorialProgressViewSet(viewsets.ModelViewSet):
    queryset = TutorialProgress.objects.all()
    serializer_class = TutorialProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TutorialProgress.objects.filter(student=self.request.user)

    def _to_int(self, v, default=None):
        if v is None or v == "":
            return default
        try:
            return int(v)
        except (ValueError, TypeError):
            return default

    def _to_bool(self, v, default=False):
        if v is None or v == "":
            return default
        if isinstance(v, bool):
            return v
        s = str(v).strip().lower()
        if s in ("1", "true", "yes", "y", "on"):
            return True
        if s in ("0", "false", "no", "n", "off"):
            return False
        return default

    @action(detail=False, methods=["get"], url_path="my")
    def my_progress(self, request):
        qs = self.get_queryset().select_related("tutorial")
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path=r"by-tutorial/(?P<tutorial_id>\d+)")
    def by_tutorial(self, request, tutorial_id=None):
        record = TutorialProgress.objects.filter(
            student=request.user, tutorial_id=tutorial_id
        ).first()
        if not record:
            return Response({}, status=status.HTTP_200_OK)
        return Response(self.get_serializer(record).data)

    def create(self, request, *args, **kwargs):
        student = request.user
        tutorial_id = request.data.get("tutorial")
        if not tutorial_id:
            return Response({"error": "Tutorial ID required"}, status=400)

        tutorial = get_object_or_404(Tutorial, id=tutorial_id)

        incoming_progress = self._to_int(request.data.get("progress_percentage"), default=0)
        incoming_progress = max(0, min(100, incoming_progress))
        incoming_completed = self._to_bool(request.data.get("completed"), default=False)

        if incoming_progress >= 95:
            incoming_completed = True
            incoming_progress = 100

        existing = TutorialProgress.objects.filter(student=student, tutorial=tutorial).first()

        if existing:
            existing_progress = self._to_int(existing.progress_percentage, default=0) or 0
            progress_to_save = max(existing_progress, incoming_progress)

            completed_to_save = bool(existing.completed) or bool(incoming_completed)
            if completed_to_save:
                progress_to_save = 100

            payload = {
                "tutorial": tutorial.id,
                "progress_percentage": progress_to_save,
                "completed": completed_to_save,
            }

            serializer = self.get_serializer(existing, data=payload, partial=True)
            serializer.is_valid(raise_exception=True)
            progress_record = serializer.save(last_watched_at=timezone.now())
        else:
            payload = {
                "tutorial": tutorial.id,
                "progress_percentage": incoming_progress,
                "completed": incoming_completed,
            }
            serializer = self.get_serializer(data=payload)
            serializer.is_valid(raise_exception=True)
            progress_record = serializer.save(student=student, last_watched_at=timezone.now())

        if hasattr(student, "student_profile"):
            count = TutorialProgress.objects.filter(student=student, completed=True).count()
            StudentProfile.objects.filter(user=student).update(tutorials_watched=count)

        return Response(self.get_serializer(progress_record).data, status=status.HTTP_200_OK)


# --------------- LAB LOGIC --------------- #

class LabViewSet(viewsets.ModelViewSet):
    queryset = Lab.objects.all()
    serializer_class = LabSerializer
    permission_classes = [IsAuthenticated]

    def _safe_filename(self, s: str) -> str:
        s = (s or "").strip()
        if not s:
            return "lab"
        s = re.sub(r"[^a-zA-Z0-9_\-]+", "_", s)
        return s[:60] or "lab"

    def _status_display(self, booking_obj):
        comment = (getattr(booking_obj, "admin_comment", "") or "").lower()
        if "cancelled by student" in comment:
            return "cancelled"
        return (getattr(booking_obj, "status", "") or "").strip().lower() or ""

    def _is_extended(self, booking_obj) -> str:
        comment = (getattr(booking_obj, "admin_comment", "") or "").lower()
        return "Yes" if ("extended by student" in comment or "extended:" in comment) else "No"

    def _get_combined_status(self, booking_obj) -> str:
        comment = (getattr(booking_obj, "admin_comment", "") or "").lower()

        if "extended by student" in comment or "extended:" in comment:
            return "Extended"

        if "cancelled by student" in comment:
            return "Cancelled"

        status_v = (getattr(booking_obj, "status", "") or "").strip().lower()
        if status_v == "approved":
            return "Approved"
        elif status_v == "completed":
            return "Completed"
        elif status_v == "rejected":
            return "Rejected"
        elif status_v == "pending":
            return "Pending"
        else:
            return status_v.capitalize() if status_v else "Unknown"

    def _checkout_time_from_comment(self, booking_obj) -> str:
        comment = getattr(booking_obj, "admin_comment", "") or ""
        m = re.search(r"CHECKOUT:\s*([0-9]{4}-[0-9]{2}-[0-9]{2}\s+[0-9]{2}:[0-9]{2}:[0-9]{2})", comment)
        return m.group(1) if m else ""

    @action(detail=True, methods=["get"], url_path="availability", permission_classes=[IsAuthenticated])
    def availability(self, request, pk=None):
        lab = self.get_object()

        date_str = request.query_params.get("date") or ""
        time_slot = request.query_params.get("time_slot") or ""

        date_str = str(date_str).strip()
        time_slot = str(time_slot).strip().replace(" ", "")

        if not date_str or not time_slot:
            return Response(
                {"detail": "date and time_slot are required", "available_imacs": []},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            booking_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except Exception:
            return Response(
                {"detail": "Invalid date format. Use YYYY-MM-DD", "available_imacs": []},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            cleaned = time_slot.replace("–", "-")
            parts = cleaned.split("-")
            if len(parts) != 2:
                raise ValueError("bad time_slot")
            start = parts[0].strip()[:5]
            end = parts[1].strip()[:5]
            time_slot_norm = f"{start}-{end}"
        except Exception:
            return Response(
                {"detail": "Invalid time_slot. Use HH:MM-HH:MM", "available_imacs": []},
                status=status.HTTP_400_BAD_REQUEST,
            )

        imac_pool = list(range(1, 31))
        blocking_statuses = ["pending", "approved"]

        booked = (
            LabBooking.objects.filter(
                lab=lab,
                booking_date=booking_date,
                time_slot=time_slot_norm,
                status__in=blocking_statuses,
            )
            .exclude(imac_number__isnull=True)
            .values_list("imac_number", flat=True)
        )
        booked_set = set(int(x) for x in booked if x)

        available = [n for n in imac_pool if n not in booked_set]

        return Response(
            {
                "lab_id": lab.id,
                "lab_name": getattr(lab, "name", ""),
                "date": booking_date.strftime("%Y-%m-%d"),
                "time_slot": time_slot_norm,
                "available_imacs": available,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"], url_path="bookings-export", permission_classes=[IsAuthenticated, IsAdminUser])
    def bookings_export(self, request, pk=None):
        lab = self.get_object()

        qs = (
            LabBooking.objects.filter(lab=lab)
            .exclude(Q(student__is_staff=True) | Q(student__user_type="admin"))
            .select_related("student", "student__student_profile", "reviewed_by")
            .order_by("-created_at", "-id")
        )

        response = HttpResponse(content_type="text/csv")
        safe_lab = self._safe_filename(getattr(lab, "name", "") or "")
        filename = f"{safe_lab}_{lab.id}_bookings.csv"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)

        writer.writerow([
            "Booking ID",
            "Lab",
            "Student ID",
            "Student Name",
            "Time Slot",
            "iMac Number",
            "Purpose",
            "Participants",
            "Admin Comment",
            "Status",
            "Check Out Time",
        ])

        for b in qs:
            student_user = getattr(b, "student", None)

            student_id = "N/A"
            if student_user and hasattr(student_user, "student_profile"):
                try:
                    sid = getattr(student_user.student_profile, "student_id", None)
                    if sid:
                        student_id = str(sid)
                except Exception:
                    pass

            student_name = ""
            try:
                student_name = (student_user.get_full_name() or "").strip() if student_user else ""
            except Exception:
                student_name = ""
            if not student_name:
                student_name = getattr(student_user, "username", "") or "N/A"

            time_slot = b.time_slot or ""
            if not time_slot:
                try:
                    st = b.start_time.strftime("%H:%M") if b.start_time else ""
                    et = b.end_time.strftime("%H:%M") if b.end_time else ""
                    if st and et:
                        time_slot = f"{st}-{et}"
                except Exception:
                    pass

            combined_status = self._get_combined_status(b)
            checkout_at = self._checkout_time_from_comment(b)

            writer.writerow([
                b.id,
                getattr(lab, "name", "") or "Lab",
                student_id,
                student_name,
                time_slot,
                getattr(b, "imac_number", "") or "",
                getattr(b, "purpose", "") or "",
                getattr(b, "participants", "") or "",
                getattr(b, "admin_comment", "") or "",
                combined_status,
                checkout_at,
            ])

        return response


class LabBookingViewSet(viewsets.ModelViewSet):
    queryset = LabBooking.objects.all()
    serializer_class = LabBookingSerializer
    permission_classes = [IsAuthenticated]

    def _parse_end_time_from_time_slot(self, time_slot: str):
        if not time_slot:
            return None
        try:
            cleaned = str(time_slot).replace(" ", "")
            if "-" not in cleaned:
                return None
            _start_str, end_str = cleaned.split("-", 1)
            return datetime.strptime(end_str.strip(), "%H:%M").time()
        except Exception:
            return None

    def _make_aware_dt(self, naive_dt: datetime) -> datetime:
        if timezone.is_aware(naive_dt):
            return naive_dt
        tz = timezone.get_current_timezone()
        return timezone.make_aware(naive_dt, tz)

    def _normalize_time_slot(self, time_slot: str):
        try:
            cleaned = str(time_slot or "").strip().replace(" ", "").replace("–", "-")
            parts = cleaned.split("-")
            if len(parts) != 2:
                return None
            start = parts[0].strip()[:5]
            end = parts[1].strip()[:5]
            return f"{start}-{end}"
        except Exception:
            return None

    def _auto_complete_qs(self, qs):
        now = timezone.now()
        candidates = qs.filter(booking_date__isnull=False).exclude(status__isnull=True)

        for b in candidates:
            status_lower = (b.status or "").strip().lower()
            if status_lower != "approved":
                continue

            end_t = b.end_time or self._parse_end_time_from_time_slot(getattr(b, "time_slot", "") or "")
            if end_t is None:
                continue

            try:
                end_dt_naive = datetime.combine(b.booking_date, end_t)
                end_dt = self._make_aware_dt(end_dt_naive)
            except Exception:
                continue

            if end_dt < now:
                b.status = "completed"
                try:
                    b.reviewed_at = now
                    b.save(update_fields=["status", "reviewed_at"])
                except Exception:
                    b.save(update_fields=["status"])

    def get_queryset(self):
        user = self.request.user
        qs = LabBooking.objects.select_related("lab", "student").order_by("-created_at", "-id")

        if _is_admin(user):
            self._auto_complete_qs(qs)
            return qs

        student_qs = qs.filter(student=user)
        self._auto_complete_qs(student_qs)
        return student_qs

    @action(detail=False, methods=["get"], url_path="available-imacs", permission_classes=[IsAuthenticated])
    def available_imacs(self, request):
        lab_room = (request.query_params.get("lab_room") or "").strip()
        date_str = (request.query_params.get("date") or "").strip()
        time_slot = (request.query_params.get("time_slot") or "").strip().replace(" ", "")

        if not lab_room or not date_str or not time_slot:
            return Response({"available_imacs": [], "detail": "lab_room, date, time_slot required"}, status=400)

        lab = Lab.objects.filter(name=lab_room).first()
        if not lab:
            return Response({"available_imacs": [], "detail": "Lab not found"}, status=404)

        try:
            booking_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except Exception:
            return Response({"available_imacs": [], "detail": "Invalid date format"}, status=400)

        time_slot_norm = self._normalize_time_slot(time_slot)
        if not time_slot_norm:
            return Response({"available_imacs": [], "detail": "Invalid time_slot"}, status=400)

        booked = (
            LabBooking.objects.filter(
                lab=lab,
                booking_date=booking_date,
                time_slot=time_slot_norm,
                status__in=["pending", "approved"],
            )
            .exclude(imac_number__isnull=True)
            .values_list("imac_number", flat=True)
        )
        booked_set = set(int(x) for x in booked if x)

        available = [n for n in range(1, 31) if n not in booked_set]
        return Response({"available_imacs": available}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdminUser])
    def approve(self, request, pk=None):
        booking = self.get_object()

        if (booking.status or "").strip().lower() != "pending":
            return Response({"detail": "Only pending bookings can be approved."}, status=400)

        admin_comment = request.data.get("admin_comment", None)

        booking.status = "approved"
        booking.reviewed_by = request.user
        booking.reviewed_at = timezone.now()

        if admin_comment is not None:
            booking.admin_comment = str(admin_comment).strip()

        booking.save(update_fields=["status", "reviewed_by", "reviewed_at", "admin_comment", "updated_at"])
        return Response(self.get_serializer(booking).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdminUser])
    def reject(self, request, pk=None):
        booking = self.get_object()

        if (booking.status or "").strip().lower() != "pending":
            return Response({"detail": "Only pending bookings can be rejected."}, status=400)

        reason = request.data.get("reason") or ""
        admin_comment = request.data.get("admin_comment")
        final_comment = (str(admin_comment).strip() if admin_comment is not None else "") or str(reason).strip()

        booking.status = "rejected"
        booking.reviewed_by = request.user
        booking.reviewed_at = timezone.now()
        booking.admin_comment = final_comment

        booking.save(update_fields=["status", "reviewed_by", "reviewed_at", "admin_comment", "updated_at"])
        return Response(self.get_serializer(booking).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        booking = self.get_object()

        if booking.student_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=403)

        current_status = (booking.status or "").strip().lower()
        if current_status != "pending":
            return Response({"detail": "Only pending bookings can be cancelled."}, status=400)

        booking.status = "rejected"
        stamp = timezone.now().astimezone(timezone.get_current_timezone()).strftime("%Y-%m-%d %H:%M:%S")
        msg = f"Cancelled by student at {stamp}"

        booking.admin_comment = (booking.admin_comment or "").strip()
        booking.admin_comment = f"{booking.admin_comment}\n{msg}".strip() if booking.admin_comment else msg

        booking.save(update_fields=["status", "admin_comment", "updated_at"])
        return Response(self.get_serializer(booking).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def extend(self, request, pk=None):
        booking = self.get_object()

        if booking.student_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=403)

        current_status = (booking.status or "").strip().lower()
        if current_status != "approved":
            return Response({"detail": "Only approved bookings can be extended."}, status=400)

        new_time_slot = request.data.get("new_time_slot") or request.data.get("time_slot") or ""
        new_time_slot_norm = self._normalize_time_slot(new_time_slot)
        if not new_time_slot_norm:
            return Response({"detail": "new_time_slot is required (HH:MM-HH:MM)."}, status=400)

        imac_no = getattr(booking, "imac_number", None)
        if imac_no:
            conflict = (
                LabBooking.objects.filter(
                    lab=booking.lab,
                    booking_date=booking.booking_date,
                    time_slot=new_time_slot_norm,
                    imac_number=imac_no,
                    status__in=["pending", "approved"],
                )
                .exclude(id=booking.id)
                .exists()
            )
            if conflict:
                return Response({"detail": f"iMac {imac_no} is not available for this new time slot."}, status=400)

        old_slot = booking.time_slot or ""
        booking.time_slot = new_time_slot_norm

        stamp = timezone.now().astimezone(timezone.get_current_timezone()).strftime("%Y-%m-%d %H:%M:%S")
        msg = f"EXTENDED: {old_slot} -> {new_time_slot_norm} (extended by student at {stamp})"

        booking.admin_comment = (booking.admin_comment or "").strip()
        booking.admin_comment = f"{booking.admin_comment}\n{msg}".strip() if booking.admin_comment else msg

        booking.save(update_fields=["time_slot", "admin_comment", "updated_at"])
        return Response(self.get_serializer(booking).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def checkout(self, request, pk=None):
        booking = self.get_object()

        if booking.student_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=403)

        current_status = (booking.status or "").strip().lower()
        if current_status != "approved":
            return Response({"detail": "Only approved bookings can be checked out."}, status=400)

        now_local = timezone.now().astimezone(timezone.get_current_timezone()).strftime("%Y-%m-%d %H:%M:%S")

        booking.status = "completed"
        msg = f"CHECKOUT: {now_local}"

        booking.admin_comment = (booking.admin_comment or "").strip()
        booking.admin_comment = f"{booking.admin_comment}\n{msg}".strip() if booking.admin_comment else msg

        booking.save(update_fields=["status", "admin_comment", "updated_at"])
        return Response(self.get_serializer(booking).data, status=status.HTTP_200_OK)


# --------------- EQUIPMENT LOGIC --------------- #

class EquipmentCategoryViewSet(viewsets.ModelViewSet):
    queryset = EquipmentCategory.objects.all()
    serializer_class = EquipmentCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # list/retrieve for all logged-in
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated()]
        # create/update/delete only admin
        return [IsAuthenticated(), IsAdminUser()]


class EquipmentRequestViewSet(viewsets.ModelViewSet):
    queryset = EquipmentRequest.objects.all()
    serializer_class = EquipmentRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = EquipmentRequest.objects.select_related("student").prefetch_related(
            "items", "items__equipment"
        ).order_by("-created_at", "-id")

        if _is_admin(user):
            return qs

        return qs.filter(student=user)

    def _recalc_bundle_status(self, req_obj: EquipmentRequest) -> str:
        if (req_obj.status or "").strip().lower() == "cancelled":
            return req_obj.status

        statuses = list(req_obj.items.values_list("status", flat=True))
        if not statuses:
            req_obj.status = "pending"
            req_obj.save(update_fields=["status", "updated_at"])
            return req_obj.status

        statuses = [(s or "").strip().lower() for s in statuses]

        if all(s == "pending" for s in statuses):
            new_status = "pending"
        elif all(s == "approved" for s in statuses):
            new_status = "approved"
        elif all(s == "rejected" for s in statuses):
            new_status = "rejected"
        elif all(s == "cancelled" for s in statuses):
            # if everything cancelled, keep bundle cancelled for clarity
            new_status = "cancelled"
        else:
            new_status = "partial"

        if (req_obj.status or "").strip().lower() != new_status:
            req_obj.status = new_status
            req_obj.save(update_fields=["status", "updated_at"])

        return req_obj.status

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        req_obj = self.get_object()

        if req_obj.student_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=403)

        current = (req_obj.status or "").strip().lower()
        if current not in ["pending", "partial"]:
            return Response({"detail": "Only pending/partial requests can be cancelled."}, status=400)

        with transaction.atomic():
            req_obj.status = "cancelled"
            req_obj.save(update_fields=["status", "updated_at"])

            # cancel only pending items
            EquipmentRequestItem.objects.filter(request=req_obj, status="pending").update(
                status="cancelled",
                updated_at=timezone.now()
            )

        req_obj.refresh_from_db()
        return Response(self.get_serializer(req_obj).data, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["post"],
        url_path=r"items/(?P<item_id>[^/.]+)/approve",
        permission_classes=[IsAuthenticated, IsAdminUser],
    )
    def approve_item(self, request, pk=None, item_id=None):
        req_obj = self.get_object()

        try:
            item = EquipmentRequestItem.objects.select_related("equipment", "request").get(
                id=item_id, request=req_obj
            )
        except EquipmentRequestItem.DoesNotExist:
            return Response({"detail": "Item not found."}, status=404)

        if (item.status or "").strip().lower() != "pending":
            return Response({"detail": "Only pending items can be approved."}, status=400)

        equipment = item.equipment

        # quantity check
        try:
            needed = int(item.quantity or 0)
        except Exception:
            needed = 0
        if needed < 1:
            return Response({"detail": "Invalid quantity."}, status=400)

        # ✅ Use model-computed availability (no manual quantity_available changes)
        available_units = _get_equipment_available_units(equipment)
        if available_units < needed:
            return Response(
                {"detail": f"Not enough quantity available for this item. Available: {available_units}, needed: {needed}"},
                status=400
            )

        with transaction.atomic():
            now = timezone.now()
            try:
                days = int(item.duration_days or 1)
            except Exception:
                days = 1
            if days < 1:
                days = 1

            # Build rental kwargs safely (in case your model has/doesn't have certain fields)
            rental_kwargs = dict(
                equipment=equipment,
                student=req_obj.student,
                duration_days=days,
                rental_date=now,
                expected_return_date=now + timedelta(days=days),
                status="approved",
                notes=(item.notes or req_obj.notes or ""),
                issued_by=request.user,
                reviewed_by=request.user,
                reviewed_at=now,
            )
            # Optional fields
            if _model_has_field(EquipmentRental(), "reject_reason"):
                rental_kwargs["reject_reason"] = None
            if _model_has_field(EquipmentRental(), "quantity"):
                rental_kwargs["quantity"] = needed
            if _model_has_field(EquipmentRental(), "units"):
                rental_kwargs["units"] = needed

            rental = EquipmentRental.objects.create(**rental_kwargs)

            # update item
            item.status = "approved"
            item.reviewed_by = request.user
            item.reviewed_at = now
            item.reject_reason = None
            item.rental = rental
            item.save(update_fields=["status", "reviewed_by", "reviewed_at", "reject_reason", "rental", "updated_at"])

            # ✅ resync equipment using model logic
            _equipment_sync(equipment)

            # update bundle status
            self._recalc_bundle_status(req_obj)

            # update student stats
            if hasattr(req_obj.student, "student_profile"):
                try:
                    count = EquipmentRental.objects.filter(student=req_obj.student, status="approved").count()
                    StudentProfile.objects.filter(user=req_obj.student).update(active_rentals=count)
                except Exception:
                    pass

        req_obj.refresh_from_db()
        return Response(self.get_serializer(req_obj).data, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["post"],
        url_path=r"items/(?P<item_id>[^/.]+)/reject",
        permission_classes=[IsAuthenticated, IsAdminUser],
    )
    def reject_item(self, request, pk=None, item_id=None):
        req_obj = self.get_object()

        try:
            item = EquipmentRequestItem.objects.select_related("equipment", "request").get(
                id=item_id, request=req_obj
            )
        except EquipmentRequestItem.DoesNotExist:
            return Response({"detail": "Item not found."}, status=404)

        if (item.status or "").strip().lower() != "pending":
            return Response({"detail": "Only pending items can be rejected."}, status=400)

        reason = request.data.get("reason") or request.data.get("reject_reason") or ""
        reason = str(reason).strip() or "Rejected by admin"

        now = timezone.now()

        with transaction.atomic():
            item.status = "rejected"
            item.reviewed_by = request.user
            item.reviewed_at = now
            item.reject_reason = reason
            item.save(update_fields=["status", "reviewed_by", "reviewed_at", "reject_reason", "updated_at"])

            self._recalc_bundle_status(req_obj)

        req_obj.refresh_from_db()
        return Response(self.get_serializer(req_obj).data, status=status.HTTP_200_OK)


class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticated]

    def _safe_filename(self, s: str) -> str:
        s = (s or "").strip()
        if not s:
            return "equipment"
        s = re.sub(r"[^a-zA-Z0-9_\-]+", "_", s)
        return s[:60] or "equipment"

    def _category_value(self, eq) -> str:
        """
        ✅ Your Equipment uses M2M `categories` (see serializer).
        Export as comma-separated category names.
        """
        try:
            cats = list(eq.categories.all())
            names = []
            for c in cats:
                nm = getattr(c, "name", None)
                if nm and str(nm).strip():
                    names.append(str(nm).strip())
            return ", ".join(names)
        except Exception:
            return ""

    @action(detail=False, methods=["get"], url_path="export", permission_classes=[IsAuthenticated, IsAdminUser])
    def export_equipment(self, request):
        qs = Equipment.objects.all().order_by("equipment_id", "id")

        response = HttpResponse(content_type="text/csv")
        filename = f"{self._safe_filename('equipment_inventory')}.csv"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        writer.writerow([
            "Equipment ID",
            "Name",
            "Description",
            "Categories",
            "Status",
            "Quantity Total",
            "Under Maintenance",
            "Quantity Available",
            "Computed Available",
            "Rentable Quantity",
            "Rented Units",
        ])

        for e in qs:
            writer.writerow([
                getattr(e, "equipment_id", "") or "",
                getattr(e, "name", "") or "",
                getattr(e, "description", "") or "",
                self._category_value(e),
                getattr(e, "status", "") or "",
                getattr(e, "quantity_total", "") if getattr(e, "quantity_total", None) is not None else "",
                getattr(e, "quantity_under_maintenance", "") if getattr(e, "quantity_under_maintenance", None) is not None else "",
                getattr(e, "quantity_available", "") if getattr(e, "quantity_available", None) is not None else "",
                getattr(e, "computed_available", "") if getattr(e, "computed_available", None) is not None else "",
                getattr(e, "rentable_quantity", "") if getattr(e, "rentable_quantity", None) is not None else "",
                (e.rented_units() if hasattr(e, "rented_units") else ""),
            ])

        return response

    def perform_update(self, serializer):
        """
        ✅ Do NOT force quantity_available manually.
        If status toggles to "available" by admin, we may optionally close open rentals (your original behavior),
        then resync via equipment.save().
        """
        user = self.request.user
        old_obj = self.get_object()
        old_status = (old_obj.status or "").strip().lower()

        updated = serializer.save()
        new_status = (updated.status or "").strip().lower()

        # If admin sets equipment back to available, close open rentals (same as before)
        if new_status == "available" and old_status != "available":
            now = timezone.now()

            open_rentals = (
                EquipmentRental.objects
                .filter(equipment=updated, status__in=["approved", "active", "overdue", "damaged"])
                .order_by("-created_at", "-id")
            )

            for r in open_rentals:
                try:
                    r.status = "returned"
                    r.actual_return_date = now
                    r.returned_to = user
                    r.save(update_fields=["status", "actual_return_date", "returned_to", "updated_at"])
                except Exception:
                    continue

                if hasattr(r.student, "student_profile"):
                    try:
                        count = EquipmentRental.objects.filter(student=r.student, status="approved").count()
                        StudentProfile.objects.filter(user=r.student).update(active_rentals=count)
                    except Exception:
                        pass

        # ✅ resync equipment numbers using model logic
        _equipment_sync(updated)

    @action(detail=False, methods=["post"])
    def checkout(self, request):
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
        if duration < 1:
            duration = 1

        notes = request.data.get("notes", "")

        available_units = _get_equipment_available_units(equipment)
        if available_units < 1:
            return Response({"error": "Item is currently out of stock"}, status=400)

        rental_kwargs = dict(
            student=request.user,
            equipment=equipment,
            rental_date=timezone.now(),
            expected_return_date=timezone.now() + timedelta(days=duration),
            status="pending",
            notes=notes,
        )
        if _model_has_field(EquipmentRental(), "duration_days"):
            rental_kwargs["duration_days"] = duration
        if _model_has_field(EquipmentRental(), "quantity"):
            rental_kwargs["quantity"] = 1
        if _model_has_field(EquipmentRental(), "units"):
            rental_kwargs["units"] = 1

        rental = EquipmentRental.objects.create(**rental_kwargs)

        return Response(
            {
                "message": "Request submitted",
                "rental": EquipmentRentalSerializer(rental, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class EquipmentRentalViewSet(viewsets.ModelViewSet):
    queryset = EquipmentRental.objects.all()
    serializer_class = EquipmentRentalSerializer
    permission_classes = [IsAuthenticated]

    def _auto_overdue_qs(self, qs):
        """
        ✅ Fast + safe auto-overdue.
        Only marks approved/active rentals overdue when expected_return_date passed.
        """
        now = timezone.now()
        try:
            qs.filter(
                expected_return_date__isnull=False,
                expected_return_date__lt=now,
                status__in=["approved", "active"],
            ).update(status="overdue", updated_at=now if _model_has_field(EquipmentRental(), "updated_at") else None)
        except Exception:
            # fallback loop (in case model doesn't have updated_at or DB rejects None)
            candidates = qs.exclude(expected_return_date__isnull=True)
            for r in candidates:
                s = (r.status or "").strip().lower()
                if s not in ["approved", "active"]:
                    continue
                if r.expected_return_date and r.expected_return_date < now:
                    r.status = "overdue"
                    try:
                        r.save(update_fields=["status", "updated_at"])
                    except Exception:
                        r.save(update_fields=["status"])

    def get_queryset(self):
        user = self.request.user
        qs = (
            EquipmentRental.objects.select_related("equipment", "student")
            .order_by("-rental_date", "-id")
        )

        if _is_admin(user):
            self._auto_overdue_qs(qs)
            return qs

        student_qs = qs.filter(student=user)
        self._auto_overdue_qs(student_qs)
        return student_qs

    def _safe_filename(self, s: str) -> str:
        s = (s or "").strip()
        if not s:
            return "equipment_rentals"
        s = re.sub(r"[^a-zA-Z0-9_\-]+", "_", s)
        return s[:60] or "equipment_rentals"

    def _fmt_dt(self, dt):
        if not dt:
            return ""
        try:
            tz = timezone.get_current_timezone()
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt, tz)
            return dt.astimezone(tz).strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            return str(dt)

    def _student_id_from_user(self, user_obj):
        if not user_obj:
            return "N/A"
        sp = getattr(user_obj, "student_profile", None)
        if not sp:
            return "N/A"
        sid = getattr(sp, "student_id", None)
        return str(sid) if sid else "N/A"

    def _student_name_from_user(self, user_obj):
        if not user_obj:
            return "N/A"
        try:
            full = (user_obj.get_full_name() or "").strip()
            if full:
                return full
        except Exception:
            pass
        return getattr(user_obj, "username", None) or "N/A"

    def _issued_admin_name(self, admin_user):
        if not admin_user:
            return ""
        try:
            full = (admin_user.get_full_name() or "").strip()
            if full:
                return full
        except Exception:
            pass
        return getattr(admin_user, "username", "") or ""

    def _computed_status(self, rental_obj):
        s = (getattr(rental_obj, "status", "") or "").strip().lower()
        if s == "returned":
            return "returned"

        now = timezone.now()
        exp = getattr(rental_obj, "expected_return_date", None)

        if s in ["approved", "active"] and exp and exp < now:
            return "overdue"

        return s or ""

    @action(detail=False, methods=["get"], url_path="export", permission_classes=[IsAuthenticated, IsAdminUser])
    def export_rentals(self, request):
        equipment_id = (request.query_params.get("equipment_id") or "").strip()
        if not equipment_id:
            return Response({"detail": "equipment_id query param is required"}, status=400)

        qs = (
            EquipmentRental.objects
            .select_related("equipment", "student", "student__student_profile", "issued_by")
            .filter(equipment__equipment_id=equipment_id)
            .order_by("-rental_date", "-id")
        )

        response = HttpResponse(content_type="text/csv")
        filename = f"{self._safe_filename(equipment_id)}_rentals.csv"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        writer.writerow([
            "Student ID",
            "Student Name",
            "Time Rented",
            "Time Returned",
            "Issued Admin",
            "Current Status",
        ])

        for r in qs:
            student_user = getattr(r, "student", None)
            issued_by = getattr(r, "issued_by", None)

            writer.writerow([
                self._student_id_from_user(student_user),
                self._student_name_from_user(student_user),
                self._fmt_dt(getattr(r, "rental_date", None)),
                self._fmt_dt(getattr(r, "actual_return_date", None)),
                self._issued_admin_name(issued_by),
                self._computed_status(r),
            ])

        return response

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdminUser])
    def approve(self, request, pk=None):
        rental = self.get_object()
        current_status = (rental.status or "").strip().lower()

        if current_status != "pending":
            return Response({"detail": "Only pending requests can be approved."}, status=400)

        equipment = rental.equipment
        available_units = _get_equipment_available_units(equipment)
        if available_units < 1:
            return Response({"detail": "Equipment is out of stock."}, status=400)

        rental.status = "approved"
        rental.issued_by = request.user
        rental.reviewed_by = request.user
        rental.reviewed_at = timezone.now()
        if hasattr(rental, "reject_reason"):
            rental.reject_reason = None
        rental.save()

        # ✅ resync equipment using model logic (no manual decrement)
        _equipment_sync(equipment)

        if hasattr(rental.student, "student_profile"):
            count = EquipmentRental.objects.filter(student=rental.student, status="approved").count()
            StudentProfile.objects.filter(user=rental.student).update(active_rentals=count)

        return Response(self.get_serializer(rental).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdminUser])
    def reject(self, request, pk=None):
        rental = self.get_object()
        current_status = (rental.status or "").strip().lower()

        if current_status != "pending":
            return Response({"detail": "Only pending requests can be rejected."}, status=400)

        reason = request.data.get("reason") or request.data.get("reject_reason") or ""
        reason = str(reason).strip() or "Rejected by admin"

        rental.status = "rejected"
        rental.reviewed_by = request.user
        rental.reviewed_at = timezone.now()
        if hasattr(rental, "reject_reason"):
            rental.reject_reason = reason
        rental.issued_by = None
        rental.save()

        # no stock impact; keep in sync anyway (safe)
        _equipment_sync(rental.equipment)

        return Response(self.get_serializer(rental).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        rental = self.get_object()
        is_admin = _is_admin(request.user)
        current_status = (rental.status or "").strip().lower()

        if not is_admin and rental.student_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=403)

        if current_status != "pending":
            return Response({"detail": "Only pending requests can be cancelled."}, status=400)

        rental.status = "rejected"
        rental.reviewed_by = request.user if is_admin else None
        rental.reviewed_at = timezone.now()
        if hasattr(rental, "reject_reason"):
            rental.reject_reason = "Cancelled by user"
        rental.save()

        # no stock impact; keep in sync anyway (safe)
        _equipment_sync(rental.equipment)

        return Response(self.get_serializer(rental).data)

    @action(detail=True, methods=["post"])
    def return_item(self, request, pk=None):
        rental = self.get_object()
        current_status = (rental.status or "").strip().lower()

        if current_status == "returned":
            return Response({"message": "Already returned"})

        if current_status not in ["approved", "overdue", "damaged", "active"]:
            return Response({"detail": "Only active/approved/overdue/damaged rentals can be returned."}, status=400)

        rental.status = "returned"
        rental.actual_return_date = timezone.now()
        rental.returned_to = request.user
        rental.save()

        # ✅ resync equipment using model logic (no manual increment)
        _equipment_sync(rental.equipment)

        if hasattr(rental.student, "student_profile"):
            count = EquipmentRental.objects.filter(student=rental.student, status="approved").count()
            StudentProfile.objects.filter(user=rental.student).update(active_rentals=count)

        return Response(self.get_serializer(rental).data)


# --------------- CV LOGIC --------------- #

class CVViewSet(viewsets.ModelViewSet):
    queryset = CV.objects.all()
    serializer_class = CVSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        if _is_admin(self.request.user):
            return CV.objects.all()
        return CV.objects.filter(student=self.request.user)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    def _safe_filename(self, s: str) -> str:
        s = (s or "").strip()
        if not s:
            return "cv"
        s = re.sub(r"[^a-zA-Z0-9_\-]+", "_", s)
        return s[:60] or "cv"

    def _build_cv_pdf(self, cv: CV) -> bytes:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib.units import inch
        from reportlab.lib.utils import ImageReader

        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        margin_l = 0.60 * inch
        margin_r = 0.60 * inch
        margin_t = 0.55 * inch
        margin_b = 0.60 * inch

        x0 = margin_l
        x1 = width - margin_r
        y = height - margin_t

        base_font = "Helvetica"
        bold_font = "Helvetica-Bold"
        italic_font = "Helvetica-Oblique"

        body_size = 10.8
        line_gap = 13.0

        def clamp(s):
            return str(s).strip() if s is not None else ""

        def ensure_space(min_needed=1.0 * inch):
            nonlocal y
            if y - min_needed < margin_b:
                c.showPage()
                y = height - margin_t

        def text_width(txt, font, size):
            return c.stringWidth(txt or "", font, size)

        def draw_center(txt, font, size, yy, center_x):
            txt = clamp(txt)
            c.setFont(font, size)
            tw = text_width(txt, font, size)
            c.drawString(center_x - (tw / 2.0), yy, txt)

        def draw_right(txt, font, size, yy, rx):
            txt = clamp(txt)
            c.setFont(font, size)
            tw = text_width(txt, font, size)
            c.drawString(rx - tw, yy, txt)

        def draw_section(title):
            nonlocal y
            ensure_space(0.50 * inch)
            y -= 10
            c.setFont(bold_font, 12)
            c.drawString(x0, y, clamp(title).upper())
            y -= 6
            c.setLineWidth(1)
            c.line(x0, y, x1, y)
            y -= 12

        def wrap_lines(text, font=base_font, size=body_size, max_w=None):
            text = clamp(text)
            if not text:
                return []
            max_w = max_w or (x1 - x0)
            c.setFont(font, size)
            words = text.split()
            out = []
            cur = ""
            for w in words:
                test = (cur + " " + w).strip()
                if text_width(test, font, size) <= max_w:
                    cur = test
                else:
                    if cur:
                        out.append(cur)
                    cur = w
            if cur:
                out.append(cur)
            return out

        def draw_wrapped(text, font=base_font, size=body_size, indent=0, max_w=None):
            nonlocal y
            lines = wrap_lines(text, font=font, size=size, max_w=(max_w or ((x1 - x0) - indent)))
            for ln in lines:
                ensure_space(0.35 * inch)
                c.setFont(font, size)
                c.drawString(x0 + indent, y, ln)
                y -= line_gap

        def draw_bullet(text, font=base_font, size=body_size, indent=0):
            nonlocal y
            t = clamp(text)
            if not t:
                return
            draw_wrapped(f"•  {t}", font=font, size=size, indent=indent)

        def split_desc_to_bullets(desc):
            d = clamp(desc)
            if not d:
                return []
            parts = [p.strip("•").strip() for p in re.split(r"[\n\r]+", d) if p.strip()]
            return [p for p in parts if p]

        def _parse_date_like(v):
            if not v:
                return None
            if isinstance(v, datetime):
                return v.date()
            if isinstance(v, date):
                return v
            s = str(v).strip()
            if not s:
                return None
            for fmt in ("%Y-%m-%d", "%Y-%m", "%Y"):
                try:
                    dt = datetime.strptime(s, fmt)
                    return dt.date()
                except Exception:
                    continue
            return None

        def _fmt_year_or_present(start_v, end_v):
            sd = _parse_date_like(start_v)
            ed = _parse_date_like(end_v)

            now_d = timezone.now().date()
            start_y = sd.year if sd else None

            if ed is None:
                end_txt = "Present"
            else:
                end_txt = "Present" if ed > now_d else str(ed.year)

            if start_y and end_txt:
                return f"{start_y}-{end_txt}"
            if start_y:
                return str(start_y)
            return end_txt if end_txt else ""

        # ------- Header data -------
        student = getattr(cv, "student", None)

        full_name = clamp(getattr(cv, "full_name", "") or "")
        if not full_name and student:
            try:
                full_name = (student.get_full_name() or "").strip()
            except Exception:
                full_name = ""
        if not full_name:
            full_name = getattr(student, "username", "STUDENT") if student else "STUDENT"

        address = clamp(getattr(cv, "location", "") or "")
        phone = clamp(getattr(cv, "phone", "") or "")
        email = clamp(getattr(cv, "email", "") or "")

        # ------- Header photo (top-left) -------
        photo_field = None
        try:
            if getattr(cv, "profile_image", None):
                photo_field = cv.profile_image
        except Exception:
            photo_field = None

        if photo_field is None:
            try:
                if student and getattr(student, "profile_picture", None):
                    photo_field = student.profile_picture
            except Exception:
                photo_field = None

        photo_w = 1.05 * inch
        photo_h = 1.10 * inch

        header_top = y
        photo_x = x0
        photo_y = header_top - photo_h - 4
        has_photo = bool(photo_field)

        if has_photo:
            try:
                img_bytes = None
                try:
                    if hasattr(photo_field, "open"):
                        photo_field.open("rb")
                        img_bytes = photo_field.read()
                        photo_field.close()
                except Exception:
                    img_bytes = None

                if img_bytes:
                    img_reader = ImageReader(BytesIO(img_bytes))
                    c.drawImage(
                        img_reader,
                        photo_x,
                        photo_y,
                        width=photo_w,
                        height=photo_h,
                        preserveAspectRatio=True,
                        mask="auto",
                    )
                else:
                    pth = getattr(photo_field, "path", None)
                    if pth:
                        img_reader = ImageReader(pth)
                        c.drawImage(
                            img_reader,
                            photo_x,
                            photo_y,
                            width=photo_w,
                            height=photo_h,
                            preserveAspectRatio=True,
                            mask="auto",
                        )
            except Exception:
                pass

        # HEADER centered like sample (photo left)
        center_x = (x0 + x1) / 2.0

        name_y = header_top - 8
        addr_y = name_y - 22
        contact_y = addr_y - 16

        draw_center(clamp(full_name).upper(), bold_font, 18, name_y, center_x)

        if address:
            draw_center(address, base_font, 11.2, addr_y, center_x)

        phone_txt = clamp(phone)
        email_txt = clamp(email)

        sep = "  |  "
        combined = ""
        if phone_txt and email_txt:
            combined = f"{phone_txt}{sep}{email_txt}"
        elif phone_txt:
            combined = phone_txt
        elif email_txt:
            combined = email_txt

        block_w_full = (x1 - x0)
        if combined:
            if text_width(combined, base_font, 11.2) <= block_w_full:
                draw_center(combined, base_font, 11.2, contact_y, center_x)
                next_y = contact_y - 22
            else:
                if phone_txt:
                    draw_center(phone_txt, base_font, 11.2, contact_y, center_x)
                    if email_txt:
                        draw_center(email_txt, base_font, 11.2, contact_y - 14, center_x)
                        next_y = contact_y - 30
                    else:
                        next_y = contact_y - 22
                else:
                    draw_center(email_txt, base_font, 11.2, contact_y, center_x)
                    next_y = contact_y - 22
        else:
            next_y = contact_y - 14

        y = next_y
        if has_photo:
            header_bottom_limit = photo_y - 14
            if y > header_bottom_limit:
                y = header_bottom_limit

        # CAREER OBJECTIVE
        summary = clamp(getattr(cv, "summary", "") or "")
        if summary:
            draw_section("CAREER OBJECTIVE")
            draw_wrapped(summary, font=base_font, size=body_size)

        # EDUCATION
        educations = Education.objects.filter(cv=cv).order_by("order", "-id")
        if educations.exists():
            draw_section("EDUCATION")
            for e in educations:
                ensure_space(0.70 * inch)

                institution = clamp(getattr(e, "institution", "") or "")
                start_date = getattr(e, "start_date", None)
                end_date = getattr(e, "end_date", None)
                date_txt = _fmt_year_or_present(start_date, end_date)

                c.setFont(bold_font, 11.2)
                if institution:
                    c.drawString(x0, y, institution)
                if date_txt:
                    draw_right(date_txt, bold_font, 11.2, y, x1)
                y -= line_gap

                degree = clamp(getattr(e, "degree", "") or "")
                if degree:
                    draw_bullet(degree, font=base_font, size=body_size, indent=10)

                desc_lines = split_desc_to_bullets(getattr(e, "description", "") or "")
                for dl in desc_lines:
                    draw_bullet(dl, font=base_font, size=body_size, indent=10)

                y -= 4

        # ACHIEVEMENTS AND ACTIVITIES
        awards = Award.objects.filter(cv=cv).order_by("order", "-year", "-id")
        involvements = Involvement.objects.filter(cv=cv).order_by("order", "-id")
        certs = Certification.objects.filter(cv=cv).order_by("order", "-year", "-id")

        ach_items = []

        for a in awards:
            title = clamp(getattr(a, "title", "") or "")
            year = clamp(getattr(a, "year", "") or "")
            desc = clamp(getattr(a, "description", "") or "")

            head = title
            if year:
                head = f"{head} ({year})" if head else f"({year})"
            if head:
                ach_items.append(("head", head))
            for dl in split_desc_to_bullets(desc):
                ach_items.append(("sub", dl))

        for inv in involvements:
            role = clamp(getattr(inv, "role", "") or "")
            org = clamp(getattr(inv, "organization", "") or "")
            year = clamp(getattr(inv, "year", "") or "")
            desc = clamp(getattr(inv, "description", "") or "")

            head = " - ".join([t for t in [role, org] if t]).strip()
            if year and head:
                head = f"{head} ({year})"
            if head:
                ach_items.append(("head", head))
            for dl in split_desc_to_bullets(desc):
                ach_items.append(("sub", dl))

        for cert in certs:
            name = clamp(getattr(cert, "name", "") or "")
            year = clamp(getattr(cert, "year", "") or "")
            head = name
            if year:
                head = f"{head} ({year})" if head else f"({year})"
            if head:
                ach_items.append(("head", head))

        if ach_items:
            draw_section("ACHIEVEMENTS AND ACTIVITIES")
            n = 1
            for kind, val in ach_items:
                if kind == "head":
                    ensure_space(0.35 * inch)
                    c.setFont(bold_font, body_size)
                    c.drawString(x0, y, f"{n}) {val}")
                    y -= line_gap
                    n += 1
                else:
                    draw_bullet(val, font=italic_font, size=body_size, indent=16)
            y -= 2

        # ✅ LEADERSHIP
        leadership_qs = Involvement.objects.filter(cv=cv).order_by("order", "-id")
        org_map = {}

        for inv in leadership_qs:
            org = clamp(getattr(inv, "organization", "") or "")
            role = clamp(getattr(inv, "role", "") or "")
            year = clamp(getattr(inv, "year", "") or "")

            if not role and not org:
                continue

            org_key = org if org else "LEADERSHIP"

            line = role if role else org
            if year and line:
                line = f"{line} ({year})"

            if org_key not in org_map:
                org_map[org_key] = []
            if line:
                org_map[org_key].append(line)

        orgs = [(k, v) for k, v in org_map.items() if k and v]
        if orgs:
            draw_section("LEADERSHIP")

            mid = (len(orgs) + 1) // 2
            left_orgs = orgs[:mid]
            right_orgs = orgs[mid:]

            col_gap = 18
            col_w = (x1 - x0 - col_gap) / 2.0
            lx = x0
            rx = x0 + col_w + col_gap

            y_left = y
            y_right = y

            def draw_org_column(org_list, start_x, start_y):
                yy = start_y
                for org_name, roles in org_list:
                    if yy - (0.45 * inch) < margin_b:
                        c.showPage()
                        yy = height - margin_t

                    c.setFont(bold_font, 11.0)
                    c.drawString(start_x, yy, org_name)
                    yy -= line_gap

                    for rline in roles:
                        lines = wrap_lines(f"•  {rline}", font=base_font, size=body_size, max_w=col_w - 4)
                        for ln in lines:
                            if yy - (0.30 * inch) < margin_b:
                                c.showPage()
                                yy = height - margin_t
                            c.setFont(base_font, body_size)
                            c.drawString(start_x + 10, yy, ln)
                            yy -= line_gap
                    yy -= 6
                return yy

            y_left_end = draw_org_column(left_orgs, lx, y_left)
            y_right_end = draw_org_column(right_orgs, rx, y_right)
            y = min(y_left_end, y_right_end) - 2

        # ✅ EXPERTISE (skills)
        def _skill_text(skill_obj):
            for attr in ("name", "skill", "title", "label"):
                try:
                    v = getattr(skill_obj, attr, None)
                    if v and str(v).strip():
                        return str(v).strip()
                except Exception:
                    continue
            return ""

        skills_qs = Skill.objects.filter(cv=cv).order_by("order", "id")
        skill_names = []
        for s in skills_qs:
            raw = _skill_text(s)
            if not raw:
                continue
            if "," in raw:
                parts = [p.strip() for p in raw.split(",") if p.strip()]
                skill_names.extend(parts)
            else:
                skill_names.append(raw)

        seen = set()
        clean_skills = []
        for s in skill_names:
            key = s.lower()
            if key in seen:
                continue
            seen.add(key)
            clean_skills.append(s)

        if clean_skills:
            draw_section("EXPERTISE")

            total_w = (x1 - x0)
            col_gap = 16
            cols = 3 if len(clean_skills) >= 9 else 2
            col_w = (total_w - (col_gap * (cols - 1))) / float(cols)

            columns = [[] for _ in range(cols)]
            for i, s in enumerate(clean_skills):
                columns[i % cols].append(s)

            rows = max(len(col) for col in columns)
            xs = [x0 + i * (col_w + col_gap) for i in range(cols)]

            for r in range(rows):
                ensure_space(0.30 * inch)
                c.setFont(base_font, body_size)
                for ci in range(cols):
                    val = columns[ci][r] if r < len(columns[ci]) else ""
                    if val:
                        c.drawString(xs[ci], y, f"•  {val}")
                y -= line_gap

            y -= 4

        # RELEVANT COURSEWORK
        projects = Project.objects.filter(cv=cv).order_by("order", "-id")
        if projects.exists():
            draw_section("RELEVANT COURSEWORK")
            for p in projects:
                name = clamp(getattr(p, "name", "") or "")
                desc = clamp(getattr(p, "description", "") or "")
                tech = clamp(getattr(p, "technologies", "") or "")

                line = name
                if tech:
                    if len(tech) <= 45:
                        line = f"{line} ({tech})" if line else tech

                if line:
                    draw_bullet(line, font=base_font, size=body_size, indent=10)

                if desc:
                    draw_wrapped(desc, font=base_font, size=body_size, indent=24)
                y -= 2

        # REFERENCE
        refs = Reference.objects.filter(cv=cv).order_by("order", "-id")
        if refs.exists():
            draw_section("REFERENCE")
            for r in refs:
                ensure_space(0.55 * inch)
                name = clamp(getattr(r, "name", "") or "")
                position = clamp(getattr(r, "position", "") or "")
                workplace = clamp(getattr(r, "workplace", "") or "")
                phone_r = clamp(getattr(r, "phone", "") or "")
                email_r = clamp(getattr(r, "email", "") or "")

                if name:
                    c.setFont(bold_font, 11.2)
                    c.drawString(x0, y, name)
                    y -= line_gap

                sub = " - ".join([t for t in [position, workplace] if t]).strip()
                if sub:
                    c.setFont(base_font, 11.0)
                    c.drawString(x0, y, sub)
                    y -= line_gap

                if phone_r:
                    c.setFont(base_font, 11.0)
                    c.drawString(x0, y, f"Phone: {phone_r}")
                    y -= line_gap

                if email_r:
                    c.setFont(base_font, 11.0)
                    c.drawString(x0, y, f"Email: {email_r}")
                    y -= line_gap

                y -= 6

        c.showPage()
        c.save()

        pdf = buffer.getvalue()
        buffer.close()
        return pdf

    @action(detail=False, methods=["get"], url_path="my/download-pdf")
    def my_download_pdf(self, request):
        cv = CV.objects.filter(student=request.user).first()
        if not cv:
            return Response({"detail": "No CV found for this user."}, status=status.HTTP_404_NOT_FOUND)

        pdf_bytes = self._build_cv_pdf(cv)
        filename = self._safe_filename(f"{request.user.username}_CV") + ".pdf"

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @action(
        detail=True,
        methods=["get"],
        url_path="download-pdf",
        permission_classes=[IsAuthenticated, IsAdminUser],
    )
    def download_pdf(self, request, pk=None):
        cv = self.get_object()
        pdf_bytes = self._build_cv_pdf(cv)

        student = getattr(cv, "student", None)
        uname = getattr(student, "username", "student") if student else "student"
        filename = self._safe_filename(f"{uname}_CV_{cv.id}") + ".pdf"

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


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
