from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError

import qrcode
from io import BytesIO
from django.core.files import File
from PIL import Image


class User(AbstractUser):
    """Extended User model for both students and admins"""
    USER_TYPE_CHOICES = (
        ('student', 'Student'),
        ('admin', 'Admin'),
    )

    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='student')
    phone = models.CharField(max_length=20, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_full_name()} ({self.username})"


class StudentProfile(models.Model):
    """Student-specific profile information"""
    YEAR_CHOICES = (
        ('1', '1st Year'),
        ('2', '2nd Year'),
        ('3', '3rd Year'),
        ('4', '4th Year'),
    )

    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(max_length=20, unique=True)
    program = models.CharField(max_length=255, default='Bachelor of Media & Communication')
    year = models.CharField(max_length=1, choices=YEAR_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    bio = models.TextField(blank=True, null=True)

    # Statistics (denormalized for performance)
    total_bookings = models.IntegerField(default=0)
    active_rentals = models.IntegerField(default=0)
    tutorials_watched = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_profiles'
        ordering = ['student_id']

    def __str__(self):
        return f"{self.student_id} - {self.user.get_full_name()}"


class AdminProfile(models.Model):
    """Admin-specific profile information"""
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_profile')
    admin_id = models.CharField(max_length=20, unique=True)
    role = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    department = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'admin_profiles'
        ordering = ['admin_id']

    def __str__(self):
        return f"{self.admin_id} - {self.user.get_full_name()}"


class Category(models.Model):
    """Tutorial categories"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color code
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Tutorial(models.Model):
    """Video tutorials"""
    LEVEL_CHOICES = (
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='tutorials')
    video_url = models.URLField()  # YouTube, Vimeo, or direct video URL
    thumbnail = models.ImageField(upload_to='tutorial_thumbnails/', blank=True, null=True)
    duration = models.IntegerField(help_text='Duration in minutes')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')
    views = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_tutorials')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tutorials'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class TutorialProgress(models.Model):
    """Track student tutorial viewing progress"""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tutorial_progress')
    tutorial = models.ForeignKey(Tutorial, on_delete=models.CASCADE, related_name='student_progress')
    completed = models.BooleanField(default=False)
    progress_percentage = models.IntegerField(default=0)  # 0-100
    last_watched_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tutorial_progress'
        unique_together = ('student', 'tutorial')
        ordering = ['-last_watched_at']

    def __str__(self):
        return f"{self.student.username} - {self.tutorial.title} ({self.progress_percentage}%)"


class Lab(models.Model):
    """Lab facilities"""
    name = models.CharField(max_length=100)
    description = models.TextField()
    capacity = models.IntegerField()
    location = models.CharField(max_length=255)
    facilities = models.TextField(help_text='Comma-separated list of facilities')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'labs'
        ordering = ['name']

    def __str__(self):
        return self.name


class LabBooking(models.Model):
    """Lab booking requests (BMC Lab iMac booking)"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    )

    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name='bookings')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lab_bookings')

    booking_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    time_slot = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text='Time slot label, e.g. "09:00-11:00"',
    )

    imac_number = models.PositiveSmallIntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(1), MaxValueValidator(30)],
        help_text='Specific iMac number (1–30)',
    )

    purpose = models.TextField()
    participants = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_bookings'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_comment = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lab_bookings'
        ordering = ['-booking_date', '-start_time']
        indexes = [
            models.Index(fields=['lab', 'booking_date', 'time_slot', 'imac_number']),
            models.Index(fields=['student', 'booking_date', 'time_slot']),
        ]

    def __str__(self):
        return f"{self.lab.name} - {self.student.username} - {self.booking_date} - iMac {self.imac_number}"


# ===================== NEW: EQUIPMENT CATEGORIES (M2M) =====================

class EquipmentCategory(models.Model):
    """Equipment categories (DO NOT reuse Tutorial Category)"""
    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=30, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'equipment_categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Equipment(models.Model):
    """Equipment inventory (AUTO inventory logic: total + maintenance only)."""

    CATEGORY_CHOICES = (
        ('camera', 'Camera'),
        ('audio', 'Audio'),
        ('lighting', 'Lighting'),
        ('accessories', 'Accessories'),
        ('other', 'Other'),
    )

    STATUS_CHOICES = (
        ('available', 'Available'),
        ('rented', 'Rented'),
        ('maintenance', 'Maintenance'),
        ('damaged', 'Damaged'),
    )

    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)  # keep for backward-compat
    equipment_id = models.CharField(max_length=50, unique=True)
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    image = models.ImageField(upload_to='equipment_images/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')

    # ✅ Admin controls ONLY these:
    quantity_total = models.IntegerField(default=1)
    quantity_under_maintenance = models.IntegerField(default=0)

    # ✅ Keep DB column for compatibility, but AUTO-SYNC it (admin must NOT manually manage it)
    quantity_available = models.IntegerField(default=1)

    is_active = models.BooleanField(default=True)

    categories = models.ManyToManyField(
        EquipmentCategory,
        blank=True,
        related_name='equipment',
        through='EquipmentCategoryMapping'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'equipment'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.equipment_id})"

    # ------------------------------
    # ✅ LIVE RENTED COUNT (SAFE ON CREATE)
    # ------------------------------
    def rented_units(self) -> int:
        """
        Each approved/active/overdue rental counts as 1 unit (because rental has no quantity field).
        IMPORTANT: When creating Equipment (no PK yet), reverse relation can't be used -> return 0.
        """
        if not self.pk:
            return 0
        return self.rentals.filter(status__in=['approved', 'active', 'overdue']).count()

    @property
    def computed_available(self) -> int:
        total = int(self.quantity_total or 0)
        rented = int(self.rented_units() or 0)
        return max(total - rented, 0)

    @property
    def rentable_quantity(self) -> int:
        return max(self.computed_available - int(self.quantity_under_maintenance or 0), 0)

    def clean(self):
        # -------- integer checks --------
        for f in ["quantity_total", "quantity_available", "quantity_under_maintenance"]:
            v = getattr(self, f, None)
            try:
                v = int(v)
            except Exception:
                raise ValidationError({f: "Must be an integer."})
            if v < 0:
                raise ValidationError({f: "Cannot be negative."})

        total = int(self.quantity_total or 0)
        maint = int(self.quantity_under_maintenance or 0)

        # ✅ safe: object may not have pk during create -> rentals can't be queried yet
        rented = int(self.rented_units() or 0) if self.pk else 0

        # total cannot be less than currently rented units
        if total < rented:
            raise ValidationError({
                "quantity_total": f"Total cannot be less than currently rented units ({rented})."
            })

        # maintenance must be <= available (not rented)
        available_now = max(total - rented, 0)
        if maint > available_now:
            raise ValidationError({
                "quantity_under_maintenance": (
                    f"Under maintenance is too high. "
                    f"Only units NOT rented can be marked maintenance. "
                    f"Max allowed now is {available_now}."
                )
            })

    def save(self, *args, **kwargs):
        # validate before saving (admin edits included)
        self.full_clean()

        # ✅ Auto-sync stored available so Django admin + API never show wrong values
        self.quantity_available = self.computed_available

        # ✅ Auto status (optional)
        if self.rentable_quantity <= 0:
            if self.quantity_under_maintenance > 0:
                self.status = 'maintenance'
            elif self.rented_units() > 0:
                self.status = 'rented'
            else:
                self.status = 'available'
        else:
            self.status = 'available'

        # QR generation unchanged
        if not self.qr_code and self.equipment_id:
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(self.equipment_id)
            qr.make(fit=True)

            img = qr.make_image(fill_color="black", back_color="white")
            buffer = BytesIO()
            img.save(buffer, format='PNG')

            file_name = f'qr_{self.equipment_id}.png'
            self.qr_code.save(file_name, File(buffer), save=False)

        super().save(*args, **kwargs)


class EquipmentCategoryMapping(models.Model):
    """Custom intermediary table for Equipment-EquipmentCategory ManyToMany relationship"""
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE)
    category = models.ForeignKey(EquipmentCategory, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'equipment_category_mapping'
        unique_together = ('equipment', 'category')
        ordering = ['created_at']

    def __str__(self):
        return f"{self.equipment.name} - {self.category.name}"


class EquipmentRental(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('active', 'Active'),
        ('returned', 'Returned'),
        ('overdue', 'Overdue'),
        ('damaged', 'Damaged'),
    )

    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name='rentals')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='equipment_rentals')

    pickup_date = models.DateField(null=True, blank=True)
    duration_days = models.PositiveSmallIntegerField(default=1)

    rental_date = models.DateTimeField(null=True, blank=True)
    expected_return_date = models.DateTimeField(null=True, blank=True)
    actual_return_date = models.DateTimeField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)

    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='issued_rentals')
    returned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_returns')

    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_rentals')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reject_reason = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class EquipmentRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('partial', 'Partial'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    )

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='equipment_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'equipment_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"Request #{self.id} - {self.student.username} - {self.status}"


class EquipmentRequestItem(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    )

    request = models.ForeignKey(EquipmentRequest, on_delete=models.CASCADE, related_name='items')
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name='request_items')

    quantity = models.PositiveIntegerField(default=1)
    duration_days = models.PositiveSmallIntegerField(default=1)
    notes = models.TextField(blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_equipment_request_items'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reject_reason = models.TextField(blank=True, null=True)

    rental = models.OneToOneField(
        EquipmentRental,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='request_item'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'equipment_request_items'
        ordering = ['created_at']

    def __str__(self):
        return f"RequestItem #{self.id} - {self.equipment.equipment_id} x{self.quantity} ({self.status})"


# ---- CV + rest unchanged below ----

class CV(models.Model):
    """Student CV/Portfolio"""
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('needs-changes', 'Needs Changes'),
        ('flagged', 'Flagged'),
    )

    student = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cv')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    profile_image = models.ImageField(upload_to='cv_photos/', null=True, blank=True)

    full_name = models.CharField(max_length=255)
    title = models.CharField(max_length=255, blank=True, null=True)
    summary = models.TextField(blank=True, null=True)

    email = models.EmailField()
    phone = models.CharField(max_length=20)
    location = models.CharField(max_length=255, blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)
    portfolio_website = models.URLField(blank=True, null=True)

    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_cvs'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_comment = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cvs'
        verbose_name = 'CV'
        verbose_name_plural = 'CVs'
        ordering = ['-updated_at']

    def __str__(self):
        return f"CV - {self.student.username}"


class Education(models.Model):
    cv = models.ForeignKey(CV, on_delete=models.CASCADE, related_name='education')
    degree = models.CharField(max_length=255)
    institution = models.CharField(max_length=255)
    start_date = models.CharField(max_length=20)
    end_date = models.CharField(max_length=20)
    description = models.TextField(blank=True, null=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'cv_education'
        ordering = ['order', '-start_date']

    def __str__(self):
        return f"{self.degree} at {self.institution}"


class Experience(models.Model):
    cv = models.ForeignKey(CV, on_delete=models.CASCADE, related_name='experience')
    position = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    start_date = models.CharField(max_length=20)
    end_date = models.CharField(max_length=20)
    description = models.TextField(blank=True, null=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'cv_experience'
        ordering = ['order', '-start_date']

    def __str__(self):
        return f"{self.position} at {self.company}"


class Project(models.Model):
    cv = models.ForeignKey(CV, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=255)
    description = models.TextField()
    technologies = models.TextField(blank=True, null=True)
    url = models.URLField(blank=True, null=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'cv_projects'
        ordering = ['order']

    def __str__(self):
        return self.name


class Certification(models.Model):
    cv = models.ForeignKey(CV, on_delete=models.CASCADE, related_name='certifications')
    name = models.CharField(max_length=255)
    issuer = models.CharField(max_length=255)
    year = models.CharField(max_length=20)
    credential_url = models.URLField(blank=True, null=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'cv_certifications'
        ordering = ['order', '-year']

    def __str__(self):
        return self.name


class Involvement(models.Model):
    cv = models.ForeignKey(CV, on_delete=models.CASCADE, related_name='involvement')
    role = models.CharField(max_length=255)
    organization = models.CharField(max_length=255)
    year = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'cv_involvement'
        ordering = ['order', '-year']

    def __str__(self):
        return f"{self.role} - {self.organization}"


class Skill(models.Model):
    cv = models.ForeignKey(CV, on_delete=models.CASCADE, related_name='skills')
    name = models.CharField(max_length=100)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'cv_skills'
        ordering = ['order']

    def __str__(self):
        return self.name


class Reference(models.Model):
    cv = models.ForeignKey(CV, on_delete=models.CASCADE, related_name='references')
    name = models.CharField(max_length=255)
    position = models.CharField(max_length=255)
    workplace = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'cv_references'
        ordering = ['order']

    def __str__(self):
        return self.name


class Language(models.Model):
    cv = models.ForeignKey(CV, on_delete=models.CASCADE, related_name='languages')
    name = models.CharField(max_length=100)
    proficiency = models.CharField(max_length=50)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'cv_languages'
        ordering = ['order', 'name']

    def __str__(self):
        return f"{self.name} ({self.proficiency})"


class Award(models.Model):
    cv = models.ForeignKey(CV, on_delete=models.CASCADE, related_name='awards')
    title = models.CharField(max_length=255)
    issuer = models.CharField(max_length=255, blank=True, null=True)
    year = models.CharField(max_length=20, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'cv_awards'
        ordering = ['order', '-year']

    def __str__(self):
        return self.title
