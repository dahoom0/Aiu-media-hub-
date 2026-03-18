# Generated manually for equipment return approval workflow

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0010_alter_lab_description_alter_lab_facilities'),
    ]

    operations = [
        migrations.AlterField(
            model_name='equipmentrental',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('approved', 'Approved'),
                    ('rejected', 'Rejected'),
                    ('active', 'Active'),
                    ('pending_return', 'Pending Return'),
                    ('returned', 'Returned'),
                    ('overdue', 'Overdue'),
                    ('damaged', 'Damaged'),
                ],
                default='pending',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='equipmentrental',
            name='return_remark',
            field=models.TextField(blank=True, help_text='Admin remark when checking returned equipment', null=True),
        ),
        migrations.AddField(
            model_name='equipmentrental',
            name='return_approved_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='approved_returns', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='equipmentrental',
            name='return_approved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
