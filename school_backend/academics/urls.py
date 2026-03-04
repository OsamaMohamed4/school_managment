from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GradeViewSet, ClassRoomViewSet

router = DefaultRouter()
router.register("grades",  GradeViewSet,    basename="grades")
router.register("classes", ClassRoomViewSet, basename="classes")

urlpatterns = [path("", include(router.urls))]