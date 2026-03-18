# Generated migration for Notification model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_fix_admin_profile_defaults'),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('message', models.TextField()),
                ('notification_type', models.CharField(choices=[('return_received', 'Return Received'), ('return_approved', 'Return Approved'), ('return_rejected', 'Return Rejected'), ('rental_approved', 'Rental Approved'), ('rental_rejected', 'Rental Rejected'), ('general', 'General')], default='general', max_length=50)),
                ('is_read', models.BooleanField(default=False)),
                ('related_rental_id', models.IntegerField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'notifications',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'is_read'], name='notificatio_user_id_is_read_idx'),
        ),
    ]
