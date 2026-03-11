from rest_framework import serializers
from .models import Quiz, Question, Choice, QuizAttempt, StudentAnswer


# ── Choices ──────────────────────────────────────────────────
class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Choice
        fields = ["id", "text", "is_correct"]


class ChoiceStudentSerializer(serializers.ModelSerializer):
    """For students — no is_correct field"""
    class Meta:
        model  = Choice
        fields = ["id", "text"]


# ── Questions ─────────────────────────────────────────────────
class QuestionSerializer(serializers.ModelSerializer):
    """Full question for teacher"""
    choices = ChoiceSerializer(many=True, required=False)

    class Meta:
        model  = Question
        fields = ["id", "text", "question_type", "points", "order",
                  "correct_answer_text", "choices"]

    def create(self, validated_data):
        choices_data = validated_data.pop("choices", [])
        question     = Question.objects.create(**validated_data)

        # Auto-create True/False choices
        if question.question_type == Question.TYPE_TF and not choices_data:
            Choice.objects.create(question=question, text="True",  is_correct=True)
            Choice.objects.create(question=question, text="False", is_correct=False)
        else:
            for c in choices_data:
                Choice.objects.create(question=question, **c)
        return question


class QuestionStudentSerializer(serializers.ModelSerializer):
    """For students — hides correct answers"""
    choices = ChoiceStudentSerializer(many=True, read_only=True)

    class Meta:
        model  = Question
        fields = ["id", "text", "question_type", "points", "order", "choices"]


# ── Quiz ──────────────────────────────────────────────────────
class QuizSerializer(serializers.ModelSerializer):
    question_count  = serializers.ReadOnlyField()
    attempt_count   = serializers.ReadOnlyField()
    teacher_name    = serializers.SerializerMethodField()
    class_room_name = serializers.SerializerMethodField()
    questions       = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model  = Quiz
        fields = ["id", "title", "description", "teacher", "teacher_name",
                  "class_room", "class_room_name", "deadline", "is_active",
                  "question_count", "attempt_count", "questions", "created_at"]
        read_only_fields = ["id", "teacher", "created_at"]

    def get_teacher_name(self, obj):
        return obj.teacher.get_full_name()

    def get_class_room_name(self, obj):
        return str(obj.class_room)


class QuizStudentSerializer(serializers.ModelSerializer):
    """For students — includes questions without answers"""
    question_count    = serializers.ReadOnlyField()
    teacher_name      = serializers.SerializerMethodField()
    class_room_name   = serializers.SerializerMethodField()
    questions         = QuestionStudentSerializer(many=True, read_only=True)
    already_attempted = serializers.SerializerMethodField()

    class Meta:
        model  = Quiz
        fields = ["id", "title", "description", "teacher_name", "class_room_name",
                  "deadline", "is_active", "question_count", "questions",
                  "already_attempted", "created_at"]

    def get_teacher_name(self, obj):
        return obj.teacher.get_full_name()

    def get_class_room_name(self, obj):
        return str(obj.class_room)

    def get_already_attempted(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return QuizAttempt.objects.filter(student=request.user, quiz=obj).exists()
        return False


# ── Submit ────────────────────────────────────────────────────
class AnswerSubmitSerializer(serializers.Serializer):
    question_id       = serializers.IntegerField()
    choice_id         = serializers.IntegerField(required=False, allow_null=True)
    short_answer_text = serializers.CharField(required=False, allow_blank=True)


class SubmitQuizSerializer(serializers.Serializer):
    answers = AnswerSubmitSerializer(many=True)


# ── Results ───────────────────────────────────────────────────
class StudentAnswerDetailSerializer(serializers.ModelSerializer):
    question_text  = serializers.SerializerMethodField()
    question_type  = serializers.SerializerMethodField()
    selected_text  = serializers.SerializerMethodField()
    correct_text   = serializers.SerializerMethodField()
    points         = serializers.SerializerMethodField()

    class Meta:
        model  = StudentAnswer
        fields = ["id", "question_text", "question_type", "selected_text",
                  "correct_text", "short_answer_text", "is_correct",
                  "points_earned", "points"]

    def get_question_text(self, obj):
        return obj.question.text

    def get_question_type(self, obj):
        return obj.question.question_type

    def get_selected_text(self, obj):
        return obj.selected_choice.text if obj.selected_choice else None

    def get_correct_text(self, obj):
        q = obj.question
        if q.question_type == "short_answer":
            return q.correct_answer_text
        correct = q.choices.filter(is_correct=True).first()
        return correct.text if correct else None

    def get_points(self, obj):
        return obj.question.points


class QuizAttemptSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    quiz_title   = serializers.SerializerMethodField()
    percentage   = serializers.ReadOnlyField()
    answers      = StudentAnswerDetailSerializer(many=True, read_only=True)

    class Meta:
        model  = QuizAttempt
        fields = ["id", "student", "student_name", "quiz", "quiz_title",
                  "score", "total_points", "percentage", "answers", "submitted_at"]

    def get_student_name(self, obj):
        return obj.student.get_full_name()

    def get_quiz_title(self, obj):
        return obj.quiz.title
