from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GradeViewSet, ClassRoomViewSet, TeachersListView, UnassignedStudentsView

router = DefaultRouter()
router.register("grades",  GradeViewSet,     basename="grades")
router.register("classes", ClassRoomViewSet,  basename="classes")

urlpatterns = [
    path("", include(router.urls)),
    path("teachers/list/",         TeachersListView.as_view(),      name="teachers-list"),
    path("students/unassigned/",   UnassignedStudentsView.as_view(), name="unassigned-students"),
]
