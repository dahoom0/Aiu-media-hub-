from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import *

# --------------------- USER --------------------- #

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'user_type', 'is_staff']
    list_filter = ['user_type', 'is_staff', 'is_active']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('user_type', 'phone', 'profile_picture')}),
    )

# --------------------- PROFILES --------------------- #

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ['student_id', 'user', 'program', 'year', 'status', 'total_bookings', 'active_rentals', 'tutorials_watched']
    list_filter = ['year', 'status', 'program']
    search_fields = ['student_id', 'user__username', 'user__email', 'user__first_name', 'user__last_name']

@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ['admin_id', 'user', 'role', 'status', 'department']
    list_filter = ['role', 'status']
    search_fields = ['admin_id', 'user__username', 'user__email']

# --------------------- TUTORIALS --------------------- #

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'color', 'created_at']
    search_fields = ['name']

@admin.register(Tutorial)
class TutorialAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'level', 'duration', 'views', 'is_active', 'created_at']
    list_filter = ['category', 'level', 'is_active']
    search_fields = ['title', 'description']

@admin.register(TutorialProgress)
class TutorialProgressAdmin(admin.ModelAdmin):
    list_display = ['student', 'tutorial', 'progress_percentage', 'completed', 'last_watched_at']
    list_filter = ['completed']
    search_fields = ['student__username', 'tutorial__title']

# --------------------- LABS --------------------- #

@admin.register(Lab)
class LabAdmin(admin.ModelAdmin):
    list_display = ['name', 'capacity', 'location', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'location']

@admin.register(LabBooking)
class LabBookingAdmin(admin.ModelAdmin):
    list_display = [
        'lab',
        'student',
        'booking_date',
        'time_slot',
        'imac_number',
        'status',
        'reviewed_by',
        'created_at',
    ]
    list_filter = ['status', 'booking_date', 'lab']
    search_fields = ['student__username', 'student__student_profile__student_id', 'lab__name']
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at']

# --------------------- EQUIPMENT --------------------- #
# ✅ IMPORTANT: enable editing ManyToMany categories (Equipment.categories)
# using the custom through model EquipmentCategoryMapping

class EquipmentCategoryMappingInline(admin.TabularInline):
    model = EquipmentCategoryMapping
    extra = 1
    autocomplete_fields = ['category']  # clean UX when you have many categories

@admin.register(EquipmentCategory)
class EquipmentCategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'color', 'created_at']
    search_fields = ['name']
    ordering = ['name']

@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'equipment_id', 'category', 'status', 'quantity_available', 'quantity_total', 'is_active']
    list_filter = ['category', 'status', 'is_active']
    search_fields = ['name', 'equipment_id']

    # ✅ THIS is what adds multi-category UI in admin
    inlines = [EquipmentCategoryMappingInline]

@admin.register(EquipmentRental)
class EquipmentRentalAdmin(admin.ModelAdmin):
    list_display = [
        'equipment',
        'student',
        'status',
        'rental_date',
        'expected_return_date',
        'actual_return_date',
        'reviewed_by',
        'reviewed_at',
        'issued_by',
        'returned_to',
    ]
    list_filter = ['status', 'rental_date', 'reviewed_at']
    search_fields = [
        'student__username',
        'student__student_profile__student_id',
        'student__email',
        'equipment__name',
        'equipment__equipment_id',
    ]
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at']
    autocomplete_fields = ['equipment', 'student', 'reviewed_by', 'issued_by', 'returned_to']

# --------------------- CV MAIN --------------------- #

@admin.register(CV)
class CVAdmin(admin.ModelAdmin):
    list_display = ['student', 'full_name', 'status', 'reviewed_by', 'created_at', 'updated_at']
    list_filter = ['status', 'created_at']
    search_fields = ['student__username', 'student__student_profile__student_id', 'full_name']

# --------------------- CV SUBMODELS --------------------- #

@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    list_display = ['cv', 'degree', 'institution', 'start_date', 'end_date', 'order']
    list_filter = ['institution']
    search_fields = ['degree', 'institution', 'cv__student__username']

@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    list_display = ['cv', 'position', 'company', 'start_date', 'end_date', 'order']
    list_filter = ['company']
    search_fields = ['position', 'company', 'cv__student__username']

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['cv', 'name', 'url', 'order']
    search_fields = ['name', 'technologies', 'cv__student__username']

@admin.register(Certification)
class CertificationAdmin(admin.ModelAdmin):
    list_display = ['cv', 'name', 'issuer', 'year', 'order']
    list_filter = ['year', 'issuer']
    search_fields = ['name', 'issuer', 'cv__student__username']

@admin.register(Involvement)
class InvolvementAdmin(admin.ModelAdmin):
    list_display = ['cv', 'role', 'organization', 'year', 'order']
    list_filter = ['year', 'organization']
    search_fields = ['role', 'organization', 'cv__student__username']

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['cv', 'name', 'order']
    search_fields = ['name', 'cv__student__username']

@admin.register(Reference)
class ReferenceAdmin(admin.ModelAdmin):
    list_display = ['cv', 'name', 'position', 'workplace', 'phone', 'email', 'order']
    search_fields = ['name', 'workplace', 'cv__student__username']

# ✅ NEW: Languages & Awards

@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ['cv', 'name', 'proficiency', 'order']
    list_filter = ['proficiency']
    search_fields = ['name', 'cv__student__username']

@admin.register(Award)
class AwardAdmin(admin.ModelAdmin):
    list_display = ['cv', 'title', 'issuer', 'year', 'order']
    list_filter = ['year', 'issuer']
    search_fields = ['title', 'issuer', 'cv__student__username']
