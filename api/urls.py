from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'student-profiles', views.StudentProfileViewSet)
router.register(r'admin-profiles', views.AdminProfileViewSet)
router.register(r'categories', views.CategoryViewSet)
router.register(r'tutorials', views.TutorialViewSet)
router.register(r'tutorial-progress', views.TutorialProgressViewSet)
router.register(r'labs', views.LabViewSet)
router.register(r'lab-bookings', views.LabBookingViewSet)
router.register(r'equipment', views.EquipmentViewSet)
router.register(r'equipment-rentals', views.EquipmentRentalViewSet)
router.register(r'cvs', views.CVViewSet)
router.register(r'education', views.EducationViewSet)
router.register(r'experience', views.ExperienceViewSet)
router.register(r'projects', views.ProjectViewSet)
router.register(r'certifications', views.CertificationViewSet)
router.register(r'involvement', views.InvolvementViewSet)
router.register(r'skills', views.SkillViewSet)
router.register(r'references', views.ReferenceViewSet)

urlpatterns = [
    # Auth endpoints
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/profile/', views.profile, name='profile'),
    path('auth/change-password/', views.change_password, name='change-password'),
    
    # Router URLs
    path('', include(router.urls)),
]