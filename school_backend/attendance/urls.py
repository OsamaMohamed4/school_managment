from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet, BulkAttendanceView, MyAttendanceView, ClassAttendanceView

router = DefaultRouter()
router.register("attendance", AttendanceViewSet, basename="attendance")

urlpatterns = [
    path("", include(router.urls)),
    path("attendance/bulk/",              BulkAttendanceView.as_view(),   name="attendance-bulk"),
    path("attendance/my/",               MyAttendanceView.as_view(),     name="attendance-my"),
    path("attendance/class/<int:class_id>/", ClassAttendanceView.as_view(), name="attendance-class"),
]