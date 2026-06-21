from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpResponse
from django.utils import timezone
from users.models import CustomUser
from attendance.models import AttendanceRecord
from quizzes.models import QuizAttempt
try:
    from assignments.models import Submission
    HAS_ASSIGNMENTS = True
except ImportError:
    HAS_ASSIGNMENTS = False
import io, textwrap

def make_pdf_bytes(html_content):
    """Simple HTML→PDF using reportlab if available, else plain text fallback."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=1.5*cm, bottomMargin=1.5*cm)
        return buf, doc, True
    except ImportError:
        return None, None, False

from users.permissions import IsAdminOrTeacher
from django.db.models import Avg, Count, Q
from academics.models import ClassSubjectTeacher, ClassRoom


class StudentReportCardView(APIView):
    """GET /api/reports/student/<id>/pdf/"""
    
    def get(self, request, student_id):
        student = CustomUser.objects.filter(pk=student_id, role="student").first()
        if not student:
            return Response({"error": "Student not found."}, status=404)

        sp  = getattr(student, "student_profile", None)
        cls = sp.class_room if sp else None

        # Verify permission
        if request.user.role == "student" and request.user.id != student.id:
            return Response({"error": "Permission denied."}, status=403)
        elif request.user.role == "parent":
            from users.models import ParentProfile
            profile = ParentProfile.objects.filter(user=request.user).first()
            if not profile or student not in profile.children.all():
                return Response({"error": "Permission denied."}, status=403)
        elif request.user.role == "teacher":
            if cls:
                is_main = cls.teacher_id == request.user.id
                is_subject = ClassSubjectTeacher.objects.filter(class_room=cls, teacher=request.user).exists()
                if not (is_main or is_subject):
                    return Response({"error": "Permission denied."}, status=403)

        att_all  = AttendanceRecord.objects.filter(student=student)
        present  = att_all.filter(status="present").count()
        att_rate = round(present/att_all.count()*100,1) if att_all.count() else 0

        attempts = QuizAttempt.objects.filter(student=student).select_related("quiz")
        agg = attempts.aggregate(avg=Avg("percentage"))
        quiz_avg = round(agg["avg"], 1) if agg["avg"] is not None else 0

        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import cm

            buf = io.BytesIO()
            doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm, leftMargin=2*cm, rightMargin=2*cm)
            styles = getSampleStyleSheet()
            story  = []

            # Title
            title_style = ParagraphStyle("title", parent=styles["Title"], fontSize=20, spaceAfter=6)
            story.append(Paragraph("EduPortal — Student Report Card", title_style))
            story.append(Spacer(1, 0.3*cm))

            # Student info
            info_style = ParagraphStyle("info", parent=styles["Normal"], fontSize=11, spaceAfter=4)
            story.append(Paragraph(f"<b>Name:</b> {student.get_full_name()}", info_style))
            story.append(Paragraph(f"<b>Email:</b> {student.email}", info_style))
            story.append(Paragraph(f"<b>Class:</b> {cls.name if cls else '—'}  |  <b>Grade:</b> {cls.grade.name if cls else '—'}", info_style))
            story.append(Paragraph(f"<b>Teacher:</b> {cls.teacher.get_full_name() if cls and cls.teacher else '—'}", info_style))
            story.append(Paragraph(f"<b>Report Date:</b> {timezone.now().strftime('%Y-%m-%d')}", info_style))
            story.append(Spacer(1, 0.5*cm))

            # Summary table
            summary_data = [
                ["Metric", "Value", "Status"],
                ["Attendance Rate", f"{att_rate}%", "✓ Good" if att_rate>=75 else "⚠ Low"],
                ["Quiz Average",    f"{quiz_avg}%", "✓ Good" if quiz_avg>=60 else "⚠ Needs Work"],
                ["Total Quizzes",   str(attempts.count()), ""],
                ["Days Present",    str(present), ""],
                ["Days Absent",     str(att_all.filter(status="absent").count()), ""],
            ]
            t = Table(summary_data, colWidths=[6*cm, 4*cm, 5*cm])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#2563EB")),
                ("TEXTCOLOR",  (0,0), (-1,0), colors.white),
                ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
                ("FONTSIZE",   (0,0), (-1,-1), 10),
                ("ALIGN",      (0,0), (-1,-1), "CENTER"),
                ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("GRID",       (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0,0), (-1,-1), 6),
                ("BOTTOMPADDING",(0,0),(-1,-1), 6),
            ]))
            story.append(Paragraph("<b>Academic Summary</b>", ParagraphStyle("h2", parent=styles["Heading2"], fontSize=13, spaceAfter=6)))
            story.append(t)
            story.append(Spacer(1, 0.6*cm))

            # Quiz results
            if attempts.exists():
                story.append(Paragraph("<b>Quiz Results</b>", ParagraphStyle("h2", parent=styles["Heading2"], fontSize=13, spaceAfter=6)))
                quiz_data = [["Quiz Title", "Score", "Percentage", "Date"]]
                for a in attempts[:15]:
                    quiz_data.append([
                        textwrap.shorten(a.quiz.title, width=35),
                        f"{a.score}/{a.total_questions}",
                        f"{a.percentage}%",
                        str(a.completed_at)[:10],
                    ])
                qt = Table(quiz_data, colWidths=[8*cm, 3*cm, 3*cm, 3*cm])
                qt.setStyle(TableStyle([
                    ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#059669")),
                    ("TEXTCOLOR",  (0,0), (-1,0), colors.white),
                    ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
                    ("FONTSIZE",   (0,0), (-1,-1), 9),
                    ("ALIGN",      (1,0), (-1,-1), "CENTER"),
                    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#F0FDF4")]),
                    ("GRID",       (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
                    ("TOPPADDING", (0,0), (-1,-1), 5),
                    ("BOTTOMPADDING",(0,0),(-1,-1), 5),
                ]))
                story.append(qt)

            doc.build(story)
            buf.seek(0)
            fname = f"report_card_{student.get_full_name().replace(' ','_')}.pdf"
            response = HttpResponse(buf.read(), content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="{fname}"'
            return response

        except ImportError:
            # Fallback: return JSON if reportlab not installed
            return Response({
                "note": "Install reportlab for PDF: pip install reportlab",
                "student": student.get_full_name(),
                "attendance_rate": att_rate,
                "quiz_avg": quiz_avg,
            })


class ClassAttendanceReportView(APIView):
    """GET /api/reports/class/<id>/attendance/pdf/"""
    permission_classes = [IsAdminOrTeacher]

    def get(self, request, class_id):
        cls = ClassRoom.objects.filter(pk=class_id).first()
        if not cls:
            return Response({"error": "Class not found."}, status=404)

        if request.user.role == "teacher":
            is_main = cls.teacher_id == request.user.id
            is_subject = ClassSubjectTeacher.objects.filter(class_room=cls, teacher=request.user).exists()
            if not (is_main or is_subject):
                return Response({"error": "Permission denied."}, status=403)

        students = CustomUser.objects.filter(student_profile__class_room=cls, is_active=True)

        try:
            from reportlab.lib.pagesizes import A4, landscape
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import cm

            buf  = io.BytesIO()
            doc  = SimpleDocTemplate(buf, pagesize=landscape(A4), topMargin=1.5*cm, bottomMargin=1.5*cm, leftMargin=1.5*cm, rightMargin=1.5*cm)
            styles = getSampleStyleSheet()
            story  = []

            story.append(Paragraph(f"EduPortal — Attendance Report: Class {cls.name}", ParagraphStyle("title", parent=styles["Title"], fontSize=16, spaceAfter=4)))
            story.append(Paragraph(f"Grade: {cls.grade.name}  |  Teacher: {cls.teacher.get_full_name() if cls.teacher else '—'}  |  Date: {timezone.now().strftime('%Y-%m-%d')}", ParagraphStyle("info", parent=styles["Normal"], fontSize=10, spaceAfter=10)))

            table_data = [["Student", "Present", "Absent", "Late", "Total", "Rate"]]
            
            student_stats = AttendanceRecord.objects.filter(
                class_room=cls
            ).values("student__id", "student__first_name", "student__last_name").annotate(
                total=Count("id"),
                pres=Count("id", filter=Q(status="present")),
                abs_=Count("id", filter=Q(status="absent")),
                late=Count("id", filter=Q(status="late")),
            )

            stats_dict = {stat["student__id"]: stat for stat in student_stats}

            for s in students:
                stat = stats_dict.get(s.id, {"pres": 0, "abs_": 0, "late": 0, "total": 0})
                pres = stat["pres"]
                total = stat["total"]
                rate = round(pres/total*100, 1) if total else 0
                table_data.append([s.get_full_name(), str(pres), str(stat["abs_"]), str(stat["late"]), str(total), f"{rate}%"])

            t = Table(table_data, colWidths=[7*cm, 2.5*cm, 2.5*cm, 2.5*cm, 2.5*cm, 3*cm])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#2563EB")),
                ("TEXTCOLOR",  (0,0), (-1,0), colors.white),
                ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
                ("FONTSIZE",   (0,0), (-1,-1), 10),
                ("ALIGN",      (1,0), (-1,-1), "CENTER"),
                ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("GRID",       (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0,0), (-1,-1), 6),
                ("BOTTOMPADDING",(0,0),(-1,-1), 6),
            ]))
            story.append(t)
            doc.build(story)
            buf.seek(0)
            fname = f"attendance_class_{cls.name}.pdf"
            response = HttpResponse(buf.read(), content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="{fname}"' 
            return response

        except ImportError:
            return Response({"note": "Install reportlab: pip install reportlab"})


class TeacherTimetablePDFView(APIView):
    """GET /api/reports/teacher/timetable/pdf/  — Teacher's personal schedule as Arabic PDF grid"""

    def get(self, request):
        if request.user.role != "teacher":
            return Response({"error": "Teachers only."}, status=403)

        teacher = request.user
        from timetable.models import TimetableSlot
        from django.db.models import Q

        subject_entries = list(ClassSubjectTeacher.objects.filter(
            teacher=teacher
        ).select_related("class_room__grade"))

        q = Q()
        for entry in subject_entries:
            q |= Q(class_room_id=entry.class_room_id, subject__iexact=entry.subject)

        assigned_class_ids = {e.class_room_id for e in subject_entries}
        extra_classes = ClassRoom.objects.filter(teacher=teacher).exclude(id__in=assigned_class_ids)
        if extra_classes.exists():
            q |= Q(class_room__in=extra_classes, teacher_name=teacher.get_full_name())

        if not subject_entries and not extra_classes.exists():
            slots = TimetableSlot.objects.none()
        else:
            slots = TimetableSlot.objects.filter(q).select_related("class_room__grade")

        DAYS_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
        AR_DAYS = {
            "sun": "الأحد",    "mon": "الإثنين", "tue": "الثلاثاء",
            "wed": "الأربعاء", "thu": "الخميس",  "fri": "الجمعة",
            "sat": "السبت",
        }
        AR_PERIODS = {
            1: "الأولى",   2: "الثانية",  3: "الثالثة",
            4: "الرابعة",  5: "الخامسة",  6: "السادسة",
            7: "السابعة",
        }

        used_days    = set()
        used_periods = set()
        grid = {}
        for s in slots:
            used_days.add(s.day)
            used_periods.add(s.period)
            grid.setdefault(s.day, {})[s.period] = s.class_room.name

        active_days  = [d for d in DAYS_ORDER if d in used_days]
        periods_asc  = sorted(used_periods) if used_periods else list(range(1, 8))
        # Reverse periods so الأولى appears on the right (RTL visual order)
        periods_rtl  = list(reversed(periods_asc))
        total_slots  = sum(len(v) for v in grid.values())
        subjects     = list({e.subject for e in subject_entries})

        try:
            import os
            from reportlab.lib.pagesizes import A4, landscape
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import cm
            from reportlab.pdfbase import pdfmetrics
            from reportlab.pdfbase.ttfonts import TTFont
            import arabic_reshaper
            from bidi.algorithm import get_display

            # Register Arabic font (Arial has full Arabic Unicode coverage)
            font_path = os.path.join(os.path.dirname(__file__), "fonts", "arial.ttf")
            pdfmetrics.registerFont(TTFont("Arabic", font_path))

            def ar(text):
                """Reshape and apply bidi to Arabic text for correct ReportLab rendering."""
                if not text:
                    return text
                reshaped = arabic_reshaper.reshape(str(text))
                return get_display(reshaped)

            buf = io.BytesIO()
            doc = SimpleDocTemplate(buf, pagesize=landscape(A4),
                                    topMargin=1.8*cm, bottomMargin=1.8*cm,
                                    leftMargin=1.5*cm, rightMargin=1.5*cm)

            AR_FONT     = "Arabic"
            TEAL_DARK   = colors.HexColor("#0D9488")
            TEAL_LIGHT  = colors.HexColor("#CCFBF1")
            TEAL_MID    = colors.HexColor("#99F6E4")
            ROW_ALT     = colors.HexColor("#F0FDFA")
            BORDER_CLR  = colors.HexColor("#5EEAD4")
            WHITE       = colors.white

            story = []

            # ── Title ────────────────────────────────────────────────────────────────
            title_st = ParagraphStyle("arTitle",
                fontName=AR_FONT, fontSize=22, leading=30,
                alignment=1, spaceAfter=8, textColor=TEAL_DARK)
            info_st = ParagraphStyle("arInfo",
                fontName=AR_FONT, fontSize=13, leading=18,
                alignment=1, spaceAfter=4, textColor=colors.HexColor("#1F2937"))

            story.append(Paragraph(ar("جدول حصص المعلم"), title_st))
            story.append(Spacer(1, 0.2*cm))

            # Header info row
            teacher_ar = ar(f"{teacher.get_full_name()}  /  المعلم")
            subject_ar = ar(f"{'، '.join(subjects) if subjects else '—'}  /  المادة")
            count_ar   = ar(f"{total_slots}  /  عدد الحصص")
            story.append(Paragraph(teacher_ar, info_st))
            story.append(Paragraph(subject_ar, info_st))
            story.append(Paragraph(count_ar,   info_st))
            story.append(Spacer(1, 0.5*cm))

            if not active_days:
                empty_st = ParagraphStyle("e", fontName=AR_FONT, fontSize=13, alignment=1)
                story.append(Paragraph(ar("لا توجد حصص مسجلة لهذا المعلم"), empty_st))
            else:
                # ── Build table data (RTL: day label on RIGHT = last column) ────────
                # Column layout: [P7 data … P1 data | Day name]
                # Visual (RTL read): Day name | P1 … P7
                corner = ar("اليوم \\ الحصة")
                header_row = [ar(AR_PERIODS.get(p, f"P{p}")) for p in periods_rtl] + [corner]

                rows = [header_row]
                for day in active_days:
                    row = [grid.get(day, {}).get(p, "") for p in periods_rtl]
                    row.append(ar(AR_DAYS[day]))
                    rows.append(row)

                n_per = len(periods_rtl)
                day_col_w = 3.2 * cm
                avail_w   = 26.5 * cm - day_col_w
                per_col_w = min(3.0 * cm, avail_w / n_per)
                col_widths = [per_col_w] * n_per + [day_col_w]
                row_heights = [1.1 * cm] + [1.4 * cm] * len(active_days)

                tbl = Table(rows, colWidths=col_widths, rowHeights=row_heights)
                tbl.setStyle(TableStyle([
                    # Header row
                    ("BACKGROUND",    (0, 0), (-1, 0), TEAL_DARK),
                    ("TEXTCOLOR",     (0, 0), (-1, 0), WHITE),
                    ("FONTNAME",      (0, 0), (-1, 0), AR_FONT),
                    ("FONTSIZE",      (0, 0), (-1, 0), 12),
                    # Day-name column (last column)
                    ("BACKGROUND",    (-1, 1), (-1, -1), TEAL_LIGHT),
                    ("FONTNAME",      (-1, 1), (-1, -1), AR_FONT),
                    ("FONTSIZE",      (-1, 1), (-1, -1), 13),
                    # Data cells
                    ("FONTNAME",      (0, 1), (-2, -1), AR_FONT),
                    ("FONTSIZE",      (0, 1), (-2, -1), 12),
                    # Alignment
                    ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
                    # Alternating rows
                    ("ROWBACKGROUNDS",(0, 1), (-2, -1), [WHITE, ROW_ALT]),
                    # Grid
                    ("GRID",          (0, 0), (-1, -1), 0.8, BORDER_CLR),
                    ("BOX",           (0, 0), (-1, -1), 1.5, TEAL_DARK),
                    # Padding
                    ("TOPPADDING",    (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]))
                story.append(tbl)

            # Footer date
            date_st = ParagraphStyle("dt", fontName=AR_FONT, fontSize=10,
                                     alignment=1, spaceBefore=10,
                                     textColor=colors.HexColor("#6B7280"))
            story.append(Spacer(1, 0.3*cm))
            story.append(Paragraph(ar(f"تاريخ الطباعة: {timezone.now().strftime('%Y-%m-%d')}"), date_st))

            doc.build(story)
            buf.seek(0)
            fname = f"jadwal_{teacher.get_full_name().replace(' ', '_')}.pdf"
            resp  = HttpResponse(buf.read(), content_type="application/pdf")
            resp["Content-Disposition"] = f'attachment; filename="{fname}"'
            return resp

        except ImportError as e:
            return Response({"note": f"Missing dependency: {e}. Run: pip install reportlab arabic-reshaper python-bidi"})
