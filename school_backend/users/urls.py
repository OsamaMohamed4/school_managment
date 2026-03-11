from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (LoginView, MeView, UserViewSet,ProfileView, ChangePasswordView,
                    ParentChildrenView, ParentChildDetailView, ParentLinkChildView)

router = DefaultRouter()
router.register("users", UserViewSet, basename="users")

urlpatterns = [
    path("auth/login/",                LoginView.as_view(),          name="login"),
    path("auth/refresh/",              TokenRefreshView.as_view(),   name="refresh"),
    path("auth/me/",                   MeView.as_view(),             name="me"),
    path("auth/parent/children/",      ParentChildrenView.as_view(), name="parent-children"),
    path("auth/parent/child/<int:child_id>/", ParentChildDetailView.as_view(), name="parent-child-detail"),
    path("auth/parent/link-child/",    ParentLinkChildView.as_view(),name="parent-link-child"),
    path("auth/", include(router.urls)),
    path("auth/profile/",         ProfileView.as_view(),        name="profile"),
    path("auth/change-password/",  ChangePasswordView.as_view(), name="change-password"),
]
