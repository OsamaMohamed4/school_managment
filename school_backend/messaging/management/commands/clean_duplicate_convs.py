"""
Management command to remove duplicate conversations from database.
Run: python manage.py clean_duplicate_convs
"""
from django.core.management.base import BaseCommand
from messaging.models import Conversation


class Command(BaseCommand):
    help = "Remove duplicate conversations (same two participants)"

    def handle(self, *args, **options):
        all_convs   = Conversation.objects.prefetch_related("participants").all()
        seen        = {}   # frozenset(participant_ids) -> first conv id
        to_delete   = []

        for conv in all_convs:
            p_ids = frozenset(conv.participants.values_list("id", flat=True))
            if p_ids in seen:
                # Keep the one with more messages
                existing_id   = seen[p_ids]
                existing_msgs = Conversation.objects.get(pk=existing_id).messages.count()
                current_msgs  = conv.messages.count()
                if current_msgs > existing_msgs:
                    to_delete.append(existing_id)
                    seen[p_ids] = conv.id
                else:
                    to_delete.append(conv.id)
            else:
                seen[p_ids] = conv.id

        if not to_delete:
            self.stdout.write(self.style.SUCCESS("No duplicate conversations found!"))
            return

        Conversation.objects.filter(pk__in=to_delete).delete()
        self.stdout.write(
            self.style.SUCCESS(f"Deleted {len(to_delete)} duplicate conversation(s).")
        )
