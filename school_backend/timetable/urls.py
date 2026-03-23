from django.urls import path
from .views import TimetableView, TimetableSlotDeleteView, MyTimetableView, MyTeacherTimetableView, ClassTeachersView

urlpatterns = [
    path("timetable/my/",                MyTimetableView.as_view(),          name="my-timetable"),
    path("timetable/teacher/",           MyTeacherTimetableView.as_view(),   name="teacher-timetable"),
    path("timetable/<int:class_id>/teachers/", ClassTeachersView.as_view(),        name="class-teachers"),
    path("timetable/<int:class_id>/",    TimetableView.as_view(),         name="timetable"),
    path("timetable/slot/<int:slot_id>/",TimetableSlotDeleteView.as_view(),name="timetable-slot-delete"),
]
