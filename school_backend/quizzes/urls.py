from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuizViewSet, StudentQuizListView, TakeQuizView, MyResultsView

router = DefaultRouter()
router.register("quizzes", QuizViewSet, basename="quizzes")

urlpatterns = [
    # Student-specific — BEFORE router
    path("quizzes/available/",          StudentQuizListView.as_view(), name="student-quizzes"),
    path("quizzes/my-results/",         MyResultsView.as_view(),       name="my-results"),
    path("quizzes/<int:quiz_id>/take/",  TakeQuizView.as_view(),        name="take-quiz"),
    path("", include(router.urls)),
]
