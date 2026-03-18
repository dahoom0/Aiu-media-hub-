# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_passwordresetotp'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lab',
            name='description',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AlterField(
            model_name='lab',
            name='facilities',
            field=models.TextField(blank=True, default='', help_text='Comma-separated list of facilities'),
        ),
    ]
