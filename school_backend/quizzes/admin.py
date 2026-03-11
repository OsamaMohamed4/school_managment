from django.contrib import admin
from .models import Quiz, Question, Choice, QuizAttempt, StudentAnswer


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 2


class QuestionInline(admin.StackedInline):
    model = Question
    extra = 1
    show_change_link = True


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display  = ["title", "teacher", "class_room", "is_active", "question_count", "attempt_count", "created_at"]
    list_filter   = ["is_active", "class_room"]
    search_fields = ["title"]
    inlines       = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ["text", "quiz", "question_type", "points", "order"]
    list_filter  = ["question_type"]
    inlines      = [ChoiceInline]


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ["student", "quiz", "score", "total_points", "submitted_at"]
    list_filter  = ["quiz"]


@admin.register(StudentAnswer)
class StudentAnswerAdmin(admin.ModelAdmin):
    list_display = ["attempt", "question", "is_correct", "points_earned"]