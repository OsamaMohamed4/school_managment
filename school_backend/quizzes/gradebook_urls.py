from django.urls import path
from .gradebook import GradeBookView

urlpatterns = [
    path("", GradeBookView.as_view(), name="gradebook"),
]
