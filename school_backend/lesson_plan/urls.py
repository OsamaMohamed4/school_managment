from django.urls import path
from .views import (
    WeeklyPlanListCreateView, WeeklyPlanDetailView,
    DailyPlanEntryView, MyClassPlanView, IsAdvisorView
)

urlpatterns = [
    path("lesson-plans/",                  WeeklyPlanListCreateView.as_view(), name="lesson-plans"),
    path("lesson-plans/<int:plan_id>/",    WeeklyPlanDetailView.as_view(),     name="lesson-plan-detail"),
    path("lesson-plans/<int:plan_id>/entries/", DailyPlanEntryView.as_view(), name="plan-entries"),
    path("lesson-plans/my-class/",         MyClassPlanView.as_view(),          name="my-class-plan"),
    path("lesson-plans/is-advisor/",       IsAdvisorView.as_view(),            name="is-advisor"),
]
