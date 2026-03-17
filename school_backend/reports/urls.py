from django.urls import path
from .views import StudentReportCardView, ClassAttendanceReportView

urlpatterns = [
    path("reports/student/<int:student_id>/pdf/", StudentReportCardView.as_view(),      name="student-report"),
    path("reports/class/<int:class_id>/attendance/pdf/", ClassAttendanceReportView.as_view(), name="class-attendance-report"),
]
