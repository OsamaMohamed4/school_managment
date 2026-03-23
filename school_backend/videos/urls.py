from django.urls import path
from .views import VideoListCreateView, VideoDetailView

urlpatterns = [
    path("videos/",         VideoListCreateView.as_view(), name="videos"),
    path("videos/<int:pk>/",VideoDetailView.as_view(),     name="video-detail"),
]
