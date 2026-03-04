from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone

from .models import Quiz, Question, QuizAttempt, StudentAnswer, Choice
from .serializers import (QuizSerializer, QuizStudentSerializer,
                           QuestionSerializer, QuizAttemptSerializer, SubmitQuizSerializer)
from users.permissions import IsTeacher, IsStudent


class QuizViewSet(ModelViewSet):
    permission_classes = [IsTeacher]
    serializer_class   = QuizSerializer

    def get_queryset(self):
        return Quiz.objects.filter(teacher=self.request.user).select_related("class_room", "teacher")

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    @action(detail=True, methods=["get"], url_path="results")
    def results(self, request, pk=None):
        quiz     = self.get_object()
        attempts = QuizAttempt.objects.filter(quiz=quiz).select_related("student")
        return Response(QuizAttemptSerializer(attempts, many=True).data)

    @action(detail=True, methods=["post"], url_path="add-question")
    def add_question(self, request, pk=None):
        quiz = self.get_object()
        serializer = QuestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(quiz=quiz)
        return Response(serializer.data, status=201)


class StudentQuizView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        profile = getattr(request.user, "student_profile", None)
        if not profile or not profile.class_room:
            return Response({"error": "Not assigned to a class."}, status=404)
        quizzes = Quiz.objects.filter(class_room=profile.class_room, is_active=True).select_related("teacher", "class_room")
        return Response(QuizStudentSerializer(quizzes, many=True, context={"request": request}).data)


class TakeQuizView(APIView):
    permission_classes = [IsStudent]

    def get(self, request, quiz_id):
        quiz = get_object_or_404(Quiz, pk=quiz_id, is_active=True)
        if QuizAttempt.objects.filter(student=request.user, quiz=quiz).exists():
            return Response({"error": "Already submitted this quiz."}, status=400)
        if quiz.deadline and timezone.now() > quiz.deadline:
            return Response({"error": "Deadline has passed."}, status=400)
        return Response(QuizStudentSerializer(quiz, context={"request": request}).data)

    @transaction.atomic
    def post(self, request, quiz_id):
        quiz = get_object_or_404(Quiz, pk=quiz_id, is_active=True)
        if QuizAttempt.objects.filter(student=request.user, quiz=quiz).exists():
            return Response({"error": "Already submitted."}, status=400)

        serializer = SubmitQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        answers_data = serializer.validated_data["answers"]
        total   = quiz.questions.count()
        correct = 0
        student_answers = []

        for ans in answers_data:
            try:
                choice = Choice.objects.get(pk=ans.get("choice_id"), question_id=ans.get("question_id"))
                if choice.is_correct:
                    correct += 1
                student_answers.append(StudentAnswer(question_id=ans.get("question_id"), selected_choice=choice, is_correct=choice.is_correct))
            except Choice.DoesNotExist:
                pass

        attempt = QuizAttempt.objects.create(student=request.user, quiz=quiz, score=correct, total_questions=total)
        for sa in student_answers:
            sa.attempt = attempt
        StudentAnswer.objects.bulk_create(student_answers)

        percentage = round((correct / total * 100), 1) if total > 0 else 0
        return Response({"message": "Quiz submitted!", "score": correct, "total": total, "percentage": percentage}, status=201)


class MyResultsView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        attempts = QuizAttempt.objects.filter(student=request.user).select_related("quiz")
        return Response(QuizAttemptSerializer(attempts, many=True).data)