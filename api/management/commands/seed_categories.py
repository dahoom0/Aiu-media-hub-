# api/management/commands/seed_categories.py
from django.core.management.base import BaseCommand
from api.models import Category


class Command(BaseCommand):
    help = 'Seed default tutorial categories'

    def handle(self, *args, **options):
        categories = [
            {'name': 'Photography', 'description': 'Photography tutorials and techniques', 'color': '#EF4444'},
            {'name': 'Video Editing', 'description': 'Video editing and post-production', 'color': '#3B82F6'},
            {'name': 'Audio Production', 'description': 'Audio recording and mixing', 'color': '#10B981'},
            {'name': 'Lighting', 'description': 'Lighting setup and techniques', 'color': '#F59E0B'},
            {'name': 'Equipment Care', 'description': 'Equipment maintenance and care', 'color': '#8B5CF6'},
            {'name': 'Studio Setup', 'description': 'Studio configuration and setup', 'color': '#EC4899'},
        ]

        created_count = 0
        existing_count = 0

        for cat_data in categories:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'description': cat_data['description'],
                    'color': cat_data['color'],
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created category: {category.name}')
                )
            else:
                existing_count += 1
                self.stdout.write(
                    self.style.WARNING(f'- Category already exists: {category.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSummary: {created_count} created, {existing_count} already existed'
            )
        )
