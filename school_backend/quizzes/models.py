from django.db import models
from django.conf import settings


class Quiz(models.Model):
    title      = models.CharField(max_length=200)
    teacher    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quizzes", limit_choices_to={"role": "teacher"})
    class_room = models.ForeignKey("academics.ClassRoom", on_delete=models.CASCADE, related_name="quizzes")
    deadline   = models.DateTimeField(null=True, blank=True)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    @property
    def question_count(self):
        return self.questions.count()

    @property
    def attempt_count(self):
        return self.attempts.count()


class Question(models.Model):
    quiz          = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    text          = models.TextField()
    question_type = models.CharField(max_length=10, default="mcq")
    order         = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]


class Choice(models.Model):
    question   = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="choices")
    text       = models.CharField(max_length=300)
    is_correct = models.BooleanField(default=False)


class QuizAttempt(models.Model):
    student         = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quiz_attempts", limit_choices_to={"role": "student"})
    quiz            = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    score           = models.FloatField(null=True, blank=True)
    total_questions = models.PositiveIntegerField(default=0)
    submitted_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["student", "quiz"]
        ordering        = ["-submitted_at"]


class StudentAnswer(models.Model):
    attempt         = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name="answers")
    question        = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(Choice, on_delete=models.CASCADE, null=True, blank=True)
    is_correct      = models.BooleanField(default=False)