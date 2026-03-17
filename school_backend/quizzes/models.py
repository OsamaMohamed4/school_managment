from django.db import models
from django.conf import settings


class Quiz(models.Model):
    title      = models.CharField(max_length=200)
    description= models.TextField(blank=True)
    teacher    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                   related_name="quizzes", limit_choices_to={"role": "teacher"})
    class_room = models.ForeignKey("academics.ClassRoom", on_delete=models.CASCADE,
                   related_name="quizzes")
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
    TYPE_MCQ   = "mcq"
    TYPE_TF    = "true_false"
    TYPE_SHORT = "short_answer"
    TYPE_CHOICES = [
        (TYPE_MCQ,   "Multiple Choice"),
        (TYPE_TF,    "True / False"),
        (TYPE_SHORT, "Short Answer"),
    ]

    quiz          = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    text          = models.TextField()
    question_type = models.CharField(max_length=15, choices=TYPE_CHOICES, default=TYPE_MCQ)
    points        = models.PositiveIntegerField(default=1)
    order         = models.PositiveIntegerField(default=0)
    # For short_answer: store the correct answer text
    correct_answer_text = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"[{self.question_type}] {self.text[:60]}"


class Choice(models.Model):
    question   = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="choices")
    text       = models.CharField(max_length=300)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{'✓' if self.is_correct else '✗'} {self.text}"


class QuizAttempt(models.Model):
    student         = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                        related_name="quiz_attempts", limit_choices_to={"role": "student"})
    quiz            = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    score           = models.FloatField(null=True, blank=True)
    total_points    = models.PositiveIntegerField(default=0)
    submitted_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["student", "quiz"]
        ordering        = ["-submitted_at"]

    @property
    def percentage(self):
        if self.total_points and self.score is not None:
            return round((self.score / self.total_points) * 100, 1)
        return 0


class StudentAnswer(models.Model):
    attempt              = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name="answers")
    question             = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice      = models.ForeignKey(Choice, on_delete=models.SET_NULL, null=True, blank=True)
    short_answer_text    = models.CharField(max_length=500, blank=True)
    is_correct           = models.BooleanField(default=False)
    points_earned        = models.FloatField(default=0)
