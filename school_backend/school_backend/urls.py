from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

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
    path("api/", include("videos.urls")),
    path("api/", include("lesson_plan.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
