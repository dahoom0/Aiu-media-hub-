from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import *
from .serializers import *

User = get_user_model()

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.is_staff or getattr(request.user, 'user_type', '') == 'admin')

# --- AUTH VIEWS ---
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Registration successful',
            'user': UserSerializer(user).data,
            'tokens': {'refresh': str(refresh), 'access': str(refresh.access_token)}
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    if username and '@' in username:
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
            if hasattr(user, 'student_profile'): profile_data = StudentProfileSerializer(user.student_profile).data
            elif hasattr(user, 'admin_profile'): profile_data = AdminProfileSerializer(user.admin_profile).data
        except: pass
        return Response({
            'user': UserSerializer(user).data, 
            'profile': profile_data,
            'tokens': {'refresh': str(refresh), 'access': str(refresh.access_token)}
        })
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    return Response({'user': UserSerializer(request.user).data})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    if not user.check_password(request.data.get('old_password')):
        return Response({'error': 'Incorrect password'}, status=400)
    user.set_password(request.data.get('new_password'))
    user.save()
    return Response({'message': 'Success'})

# --- STANDARD VIEWSETS ---
class StudentProfileViewSet(viewsets.ModelViewSet):
    queryset = StudentProfile.objects.all()
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        if self.request.user.is_staff: return StudentProfile.objects.all()
        return StudentProfile.objects.filter(user=self.request.user)

class AdminProfileViewSet(viewsets.ModelViewSet):
    queryset = AdminProfile.objects.all()
    serializer_class = AdminProfileSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

class TutorialViewSet(viewsets.ModelViewSet):
    queryset = Tutorial.objects.all()
    serializer_class = TutorialSerializer
    permission_classes = [IsAuthenticated]
    def perform_create(self, serializer): serializer.save(created_by=self.request.user)

class TutorialProgressViewSet(viewsets.ModelViewSet):
    queryset = TutorialProgress.objects.all()
    serializer_class = TutorialProgressSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): return TutorialProgress.objects.filter(student=self.request.user)
    def perform_create(self, serializer): serializer.save(student=self.request.user)

class LabViewSet(viewsets.ModelViewSet):
    queryset = Lab.objects.all()
    serializer_class = LabSerializer
    permission_classes = [IsAuthenticated]

class LabBookingViewSet(viewsets.ModelViewSet):
    queryset = LabBooking.objects.all()
    serializer_class = LabBookingSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        if self.request.user.is_staff: return LabBooking.objects.all()
        return LabBooking.objects.filter(student=self.request.user)
    def perform_create(self, serializer): serializer.save(student=self.request.user)

# --- EQUIPMENT LOGIC (THE CORE FIX) ---

class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def checkout(self, request):
        # 1. Look for 'equipment_id' (e.g., CAM-001)
        eid = request.data.get('equipment_id')
        equipment = get_object_or_404(Equipment, equipment_id=eid)
        
        # 2. Check Availability
        if equipment.quantity_available < 1:
            return Response({'error': 'Item is currently out of stock'}, status=400)
            
        # 3. Create Rental Record
        EquipmentRental.objects.create(
            student=request.user,
            equipment=equipment,
            rental_date=timezone.now(),
            expected_return_date=timezone.now() + timezone.timedelta(days=3),
            status='active'
        )
        
        # 4. Decrease Quantity
        equipment.quantity_available -= 1
        if equipment.quantity_available == 0:
            equipment.status = 'rented'
        equipment.save()
        
        return Response({'message': 'Success'})

class EquipmentRentalViewSet(viewsets.ModelViewSet):
    queryset = EquipmentRental.objects.all()
    serializer_class = EquipmentRentalSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # SECURITY: Students only see THEIR OWN rentals
        if self.request.user.is_staff:
            return EquipmentRental.objects.all()
        return EquipmentRental.objects.filter(student=self.request.user)
    
    @action(detail=True, methods=['post'])
    def return_item(self, request, pk=None):
        rental = self.get_object()
        
        if rental.status == 'returned':
            return Response({'message': 'Already returned'})

        # 1. Close Rental
        rental.status = 'returned'
        rental.actual_return_date = timezone.now()
        rental.returned_to = request.user
        rental.save()
        
        # 2. Update Equipment Inventory
        equipment = rental.equipment
        equipment.quantity_available += 1
        
        # FIX: Force status back to available
        if equipment.quantity_available > 0:
            equipment.status = 'available'
            
        equipment.save()
        
        return Response(EquipmentRentalSerializer(rental).data)

# --- CV LOGIC ---
class CVViewSet(viewsets.ModelViewSet):
    queryset = CV.objects.all()
    serializer_class = CVSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    def get_queryset(self):
        if self.request.user.is_staff: return CV.objects.all()
        return CV.objects.filter(student=self.request.user)
    def perform_create(self, serializer): serializer.save(student=self.request.user)

class BaseCVItemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    def perform_create(self, serializer):
        cv = get_object_or_404(CV, student=self.request.user)
        serializer.save(cv=cv)

class EducationViewSet(BaseCVItemViewSet):
    queryset = Education.objects.all()
    serializer_class = EducationSerializer
    def get_queryset(self): return Education.objects.filter(cv__student=self.request.user)

class ExperienceViewSet(BaseCVItemViewSet):
    queryset = Experience.objects.all()
    serializer_class = ExperienceSerializer
    def get_queryset(self): return Experience.objects.filter(cv__student=self.request.user)

class ProjectViewSet(BaseCVItemViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    def get_queryset(self): return Project.objects.filter(cv__student=self.request.user)

class SkillViewSet(BaseCVItemViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    def get_queryset(self): return Skill.objects.filter(cv__student=self.request.user)

class CertificationViewSet(BaseCVItemViewSet):
    queryset = Certification.objects.all()
    serializer_class = CertificationSerializer
    def get_queryset(self): return Certification.objects.filter(cv__student=self.request.user)

class InvolvementViewSet(BaseCVItemViewSet):
    queryset = Involvement.objects.all()
    serializer_class = InvolvementSerializer
    def get_queryset(self): return Involvement.objects.filter(cv__student=self.request.user)

class ReferenceViewSet(BaseCVItemViewSet):
    queryset = Reference.objects.all()
    serializer_class = ReferenceSerializer
    def get_queryset(self): return Reference.objects.filter(cv__student=self.request.user)