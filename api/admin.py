from django.contrib import admin

# Register your models here.

from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import *


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'user_type', 'is_staff']
    list_filter = ['user_type', 'is_staff', 'is_active']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('user_type', 'phone', 'profile_picture')}),
    )


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ['student_id', 'user', 'program', 'year', 'status']
    list_filter = ['year', 'status', 'program']
    search_fields = ['student_id', 'user__username', 'user__email', 'user__first_name', 'user__last_name']


@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ['admin_id', 'user', 'role', 'status']
    list_filter = ['role', 'status']
    search_fields = ['admin_id', 'user__username', 'user__email']


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


@admin.register(Lab)
class LabAdmin(admin.ModelAdmin):
    list_display = ['name', 'capacity', 'location', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'location']


@admin.register(LabBooking)
class LabBookingAdmin(admin.ModelAdmin):
    list_display = ['lab', 'student', 'booking_date', 'start_time', 'end_time', 'status', 'reviewed_by']
    list_filter = ['status', 'booking_date']
    search_fields = ['student__username', 'lab__name']


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'equipment_id', 'category', 'status', 'quantity_available', 'quantity_total']
    list_filter = ['category', 'status', 'is_active']
    search_fields = ['name', 'equipment_id']


@admin.register(EquipmentRental)
class EquipmentRentalAdmin(admin.ModelAdmin):
    list_display = ['equipment', 'student', 'rental_date', 'expected_return_date', 'status']
    list_filter = ['status', 'rental_date']
    search_fields = ['student__username', 'equipment__name']


@admin.register(CV)
class CVAdmin(admin.ModelAdmin):
    list_display = ['student', 'full_name', 'status', 'reviewed_by', 'created_at', 'updated_at']
    list_filter = ['status', 'created_at']
    search_fields = ['student__username', 'full_name']


admin.site.register(Education)
admin.site.register(Experience)
admin.site.register(Project)
admin.site.register(Certification)
admin.site.register(Involvement)
admin.site.register(Skill)
admin.site.register(Reference)