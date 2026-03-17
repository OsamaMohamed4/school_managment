from django.urls import path
from .views import AnalyticsDashboardView

urlpatterns = [
    path("analytics/", AnalyticsDashboardView.as_view(), name="analytics"),
]
