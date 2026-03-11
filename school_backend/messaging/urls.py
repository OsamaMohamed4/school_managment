from django.urls import path
from .views import ConversationListView, ConversationDetailView, ContactsView, UnreadCountView

urlpatterns = [
    path("messages/",                         ConversationListView.as_view(),   name="conversations"),
    path("messages/<int:conv_id>/",           ConversationDetailView.as_view(), name="conversation-detail"),
    path("messages/contacts/",                ContactsView.as_view(),           name="contacts"),
    path("messages/unread-count/",            UnreadCountView.as_view(),        name="unread-count"),
]
