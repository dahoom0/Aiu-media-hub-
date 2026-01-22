# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# --- Users (optional but useful) ---
router.register(r'users', views.UserViewSet, basename='user')

# --- Profiles ---
router.register(r'student-profiles', views.StudentProfileViewSet, basename='student-profile')
router.register(r'admin-profiles', views.AdminProfileViewSet, basename='admin-profile')

# --- Tutorials ---
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'tutorials', views.TutorialViewSet, basename='tutorial')
router.register(r'tutorial-progress', views.TutorialProgressViewSet, basename='tutorial-progress')

# --- Labs ---
router.register(r'labs', views.LabViewSet, basename='lab')
router.register(r'lab-bookings', views.LabBookingViewSet, basename='lab-booking')

# --- Equipment ---
router.register(r'equipment', views.EquipmentViewSet, basename='equipment')
router.register(r'equipment-rentals', views.EquipmentRentalViewSet, basename='equipment-rental')

# --- Equipment categories + requests ---
router.register(r'equipment-categories', views.EquipmentCategoryViewSet, basename='equipment-category')
router.register(r'equipment-requests', views.EquipmentRequestViewSet, basename='equipment-request')

# --- CV MAIN ---
router.register(r'cvs', views.CVViewSet, basename='cv')

# --- CV SUBMODELS ---
router.register(r'education', views.EducationViewSet, basename='education')
router.register(r'experience', views.ExperienceViewSet, basename='experience')
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'skills', views.SkillViewSet, basename='skill')
router.register(r'certifications', views.CertificationViewSet, basename='certification')
router.register(r'involvement', views.InvolvementViewSet, basename='involvement')
router.register(r'references', views.ReferenceViewSet, basename='reference')
router.register(r'languages', views.LanguageViewSet, basename='language')
router.register(r'awards', views.AwardViewSet, basename='award')

urlpatterns = [
    # --- Auth endpoints ---
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/profile/', views.profile, name='profile'),
    path('auth/change-password/', views.change_password, name='change-password'),

    # ✅ Password reset (OTP) endpoints (required by frontend)
    # POST /api/auth/password-reset/request-otp/
    # POST /api/auth/password-reset/confirm/
    path('auth/password-reset/request-otp/', views.request_password_reset_otp, name='password-reset-request-otp'),
    path('auth/password-reset/confirm/', views.confirm_password_reset_otp, name='password-reset-confirm'),

    # --- API routes ---
    path('', include(router.urls)),
]
