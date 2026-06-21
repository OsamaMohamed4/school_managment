from django.urls import path
from .views import StudentReportCardView, ClassAttendanceReportView, TeacherTimetablePDFView

urlpatterns = [
    path("reports/student/<int:student_id>/pdf/",          StudentReportCardView.as_view(),        name="student-report"),
    path("reports/class/<int:class_id>/attendance/pdf/",   ClassAttendanceReportView.as_view(),    name="class-attendance-report"),
    path("reports/teacher/timetable/pdf/",                 TeacherTimetablePDFView.as_view(),      name="teacher-timetable-report"),
]
