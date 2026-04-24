from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GradeViewSet, ClassRoomViewSet, TeachersListView, UnassignedStudentsView, LessonPlanView, LessonPlanDetailView

router = DefaultRouter()
router.register("grades",  GradeViewSet,     basename="grades")
router.register("classes", ClassRoomViewSet,  basename="classes")

urlpatterns = [
    path("", include(router.urls)),
    path("teachers/list/",         TeachersListView.as_view(),      name="teachers-list"),
    path("students/unassigned/",   UnassignedStudentsView.as_view(), name="unassigned-students"),
    path("lesson-plans/",          LessonPlanView.as_view(),         name="lesson-plans"),
    path("lesson-plans/<int:pk>/", LessonPlanDetailView.as_view(),   name="lesson-plans-detail"),
]
