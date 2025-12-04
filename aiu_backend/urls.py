from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth Endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API Routes (Loaded from your api/urls.py if you included it there, 
    # OR if you are using the views.py we built earlier, you might need to connect them here)
    # NOTE: Ensure your api app urls are included. 
    # If your frontend calls /api/equipment/, you need:
    path('api/', include('api.urls')), 
]

# This is the magic line that makes images work!
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)