from django.urls import path
from .views import SendNotificationView, MyNotificationsView, MarkReadView

urlpatterns = [
    path("notifications/send/",     SendNotificationView.as_view(), name="notif-send"),
    path("notifications/",          MyNotificationsView.as_view(),  name="notif-list"),
    path("notifications/mark-read/",MarkReadView.as_view(),         name="notif-mark-read"),
]
