from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import SimpleRouter
from .views import (
    LoginView, MeView, UserViewSet, AdminParentChildrenView,
    ProfileView, ChangePasswordView,
    ParentChildrenView, ParentChildDetailView, ParentLinkChildView,
)

router = SimpleRouter()
router.register("auth/users", UserViewSet, basename="users")

urlpatterns = [
    path("auth/login/",           LoginView.as_view(),          name="login"),
    path("auth/refresh/",         TokenRefreshView.as_view(),   name="token-refresh"),
    path("auth/me/",              MeView.as_view(),             name="me"),
    path("auth/profile/",         ProfileView.as_view(),        name="profile"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("auth/parent/children/",             ParentChildrenView.as_view(),    name="parent-children"),
    path("auth/parent/child/<int:child_id>/", ParentChildDetailView.as_view(), name="parent-child-detail"),
    path("auth/parent/link-child/",           ParentLinkChildView.as_view(),   name="parent-link-child"),
    path("auth/admin/parent/<int:parent_id>/children/", AdminParentChildrenView.as_view(), name="admin-parent-children"),
    path("", include(router.urls)),
]
