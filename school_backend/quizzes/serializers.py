from rest_framework import serializers
from .models import Quiz, Question, Choice, QuizAttempt


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Choice
        fields = ["id", "text", "is_correct"]


class ChoiceStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Choice
        fields = ["id", "text"]


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True)

    class Meta:
        model  = Question
        fields = ["id", "text", "question_type", "order", "choices"]

    def create(self, validated_data):
        choices_data = validated_data.pop("choices", [])
        question = Question.objects.create(**validated_data)
        for c in choices_data:
            Choice.objects.create(question=question, **c)
        return question


class QuestionStudentSerializer(serializers.ModelSerializer):
    choices = ChoiceStudentSerializer(many=True, read_only=True)

    class Meta:
        model  = Question
        fields = ["id", "text", "question_type", "order", "choices"]


class QuizSerializer(serializers.ModelSerializer):
    question_count  = serializers.ReadOnlyField()
    attempt_count   = serializers.ReadOnlyField()
    teacher_name    = serializers.SerializerMethodField()
    class_room_name = serializers.SerializerMethodField()

    class Meta:
        model  = Quiz
        fields = ["id", "title", "teacher", "teacher_name", "class_room", "class_room_name",
                  "deadline", "is_active", "question_count", "attempt_count", "created_at"]
        read_only_fields = ["id", "teacher", "created_at"]

    def get_teacher_name(self, obj):
        return obj.teacher.get_full_name()

    def get_class_room_name(self, obj):
        return str(obj.class_room)


class QuizStudentSerializer(QuizSerializer):
    questions        = QuestionStudentSerializer(many=True, read_only=True)
    already_attempted = serializers.SerializerMethodField()

    class Meta(QuizSerializer.Meta):
        fields = QuizSerializer.Meta.fields + ["questions", "already_attempted"]

    def get_already_attempted(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return QuizAttempt.objects.filter(student=request.user, quiz=obj).exists()
        return False


class SubmitQuizSerializer(serializers.Serializer):
    answers = serializers.ListField(child=serializers.DictField())


class QuizAttemptSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    quiz_title   = serializers.SerializerMethodField()
    percentage   = serializers.SerializerMethodField()

    class Meta:
        model  = QuizAttempt
        fields = ["id", "student", "student_name", "quiz", "quiz_title",
                  "score", "total_questions", "percentage", "submitted_at"]

    def get_student_name(self, obj):
        return obj.student.get_full_name()

    def get_quiz_title(self, obj):
        return obj.quiz.title

    def get_percentage(self, obj):
        if obj.total_questions and obj.score is not None:
            return round((obj.score / obj.total_questions) * 100, 1)
        return 0