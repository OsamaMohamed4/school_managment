from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone

from .models import Quiz, Question, Choice, QuizAttempt, StudentAnswer
from .serializers import (
    QuizSerializer, QuizStudentSerializer, QuestionSerializer,
    QuizAttemptSerializer, SubmitQuizSerializer,
)
from users.permissions import IsTeacher, IsStudent


class QuizViewSet(ModelViewSet):
    """Teacher: full CRUD on own quizzes"""
    permission_classes = [IsTeacher]
    serializer_class   = QuizSerializer

    def get_queryset(self):
        return Quiz.objects.filter(
            teacher=self.request.user
        ).prefetch_related("questions__choices").select_related("class_room", "teacher")

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    # PATCH /quizzes/{id}/toggle/
    @action(detail=True, methods=["patch"], url_path="toggle")
    def toggle_active(self, request, pk=None):
        quiz = self.get_object()
        quiz.is_active = not quiz.is_active
        quiz.save()
        return Response({"id": quiz.id, "is_active": quiz.is_active})

    # POST /quizzes/{id}/add-question/
    @action(detail=True, methods=["post"], url_path="add-question")
    def add_question(self, request, pk=None):
        quiz = self.get_object()
        # auto-set order
        last_order = quiz.questions.count()
        data = {**request.data, "order": last_order}
        serializer = QuestionSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(quiz=quiz)
        return Response(serializer.data, status=201)

    # DELETE /quizzes/{id}/delete-question/{q_id}/
    @action(detail=True, methods=["delete"], url_path="delete-question/(?P<q_id>[0-9]+)")
    def delete_question(self, request, pk=None, q_id=None):
        quiz     = self.get_object()
        question = get_object_or_404(Question, pk=q_id, quiz=quiz)
        question.delete()
        return Response({"message": "Question deleted."})

    # GET /quizzes/{id}/results/
    @action(detail=True, methods=["get"], url_path="results")
    def results(self, request, pk=None):
        quiz     = self.get_object()
        attempts = QuizAttempt.objects.filter(
            quiz=quiz
        ).select_related("student").prefetch_related("answers__question", "answers__selected_choice")
        return Response(QuizAttemptSerializer(attempts, many=True).data)


class StudentQuizListView(APIView):
    """Student: list available quizzes for their class"""
    permission_classes = [IsStudent]

    def get(self, request):
        profile = getattr(request.user, "student_profile", None)
        if not profile or not profile.class_room:
            return Response({"error": "Not assigned to a class."}, status=404)
        quizzes = Quiz.objects.filter(
            class_room=profile.class_room, is_active=True
        ).prefetch_related("questions__choices").select_related("teacher", "class_room")
        return Response(QuizStudentSerializer(quizzes, many=True, context={"request": request}).data)


class TakeQuizView(APIView):
    """Student: get quiz detail OR submit answers"""
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

        total_points = sum(q.points for q in quiz.questions.all())
        earned       = 0
        student_answers = []

        for ans in answers_data:
            try:
                question = Question.objects.get(pk=ans["question_id"], quiz=quiz)
            except Question.DoesNotExist:
                continue

            is_correct   = False
            points_earned = 0
            choice        = None
            short_text    = ""

            if question.question_type in (Question.TYPE_MCQ, Question.TYPE_TF):
                if ans.get("choice_id"):
                    try:
                        choice = Choice.objects.get(pk=ans["choice_id"], question=question)
                        if choice.is_correct:
                            is_correct    = True
                            points_earned = question.points
                    except Choice.DoesNotExist:
                        pass

            elif question.question_type == Question.TYPE_SHORT:
                short_text = (ans.get("short_answer_text") or "").strip()
                correct    = question.correct_answer_text.strip().lower()
                if correct and short_text.lower() == correct:
                    is_correct    = True
                    points_earned = question.points

            earned += points_earned
            student_answers.append(StudentAnswer(
                question=question,
                selected_choice=choice,
                short_answer_text=short_text,
                is_correct=is_correct,
                points_earned=points_earned,
            ))

        attempt = QuizAttempt.objects.create(
            student=request.user,
            quiz=quiz,
            score=earned,
            total_points=total_points,
        )
        for sa in student_answers:
            sa.attempt = attempt
        StudentAnswer.objects.bulk_create(student_answers)

        percentage = round((earned / total_points * 100), 1) if total_points > 0 else 0
        return Response({
            "message":      "Quiz submitted successfully!",
            "score":        earned,
            "total_points": total_points,
            "percentage":   percentage,
        }, status=201)


class MyResultsView(APIView):
    """Student: view own quiz results"""
    permission_classes = [IsStudent]

    def get(self, request):
        attempts = QuizAttempt.objects.filter(
            student=request.user
        ).select_related("quiz").prefetch_related("answers__question", "answers__selected_choice")
        return Response(QuizAttemptSerializer(attempts, many=True).data)
