from django.urls import path
from .views import TimetableView, TimetableSlotDeleteView, MyTimetableView

urlpatterns = [
    path("timetable/my/",                MyTimetableView.as_view(),       name="my-timetable"),
    path("timetable/<int:class_id>/",    TimetableView.as_view(),         name="timetable"),
    path("timetable/slot/<int:slot_id>/",TimetableSlotDeleteView.as_view(),name="timetable-slot-delete"),
]
