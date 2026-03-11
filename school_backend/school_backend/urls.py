from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("users.urls")),
    path("api/", include("academics.urls")),
    path("api/", include("attendance.urls")),
    path("api/", include("quizzes.urls")),
    path("api/", include("notifications.urls")),
    path("api/", include("timetable.urls")),
    path("api/", include("assignments.urls")),
    path("api/", include("messaging.urls")),
    path("api/", include("analytics.urls")),
    path("api/", include("reports.urls")),
    path("api/gradebook/", include("quizzes.gradebook_urls")),
]
