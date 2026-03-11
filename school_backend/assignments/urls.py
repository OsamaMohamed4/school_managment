from django.urls import path
from .views import (AssignmentListCreateView, AssignmentDetailView,
                    SubmitAssignmentView, GradeSubmissionView,
                    AssignmentSubmissionsView, MySubmissionsView)

urlpatterns = [
    path("assignments/",                          AssignmentListCreateView.as_view(),  name="assignments"),
    path("assignments/<int:pk>/",                 AssignmentDetailView.as_view(),      name="assignment-detail"),
    path("assignments/<int:pk>/submit/",          SubmitAssignmentView.as_view(),      name="assignment-submit"),
    path("assignments/<int:pk>/submissions/",     AssignmentSubmissionsView.as_view(), name="assignment-submissions"),
    path("assignments/submissions/<int:sub_id>/grade/", GradeSubmissionView.as_view(),name="grade-submission"),
    path("assignments/my-submissions/",           MySubmissionsView.as_view(),         name="my-submissions"),
]
