from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuizViewSet, StudentQuizView, TakeQuizView, MyResultsView

router = DefaultRouter()
router.register("quizzes", QuizViewSet, basename="quizzes")

urlpatterns = [
    path("", include(router.urls)),
    path("quizzes/available/",         StudentQuizView.as_view(),  name="student-quizzes"),
    path("quizzes/<int:quiz_id>/take/", TakeQuizView.as_view(),     name="take-quiz"),
    path("quizzes/my-results/",        MyResultsView.as_view(),    name="my-results"),
]