# Generated manually to fix AdminProfile defaults

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_equipmentrental_return_approval'),
    ]

    operations = [
        migrations.AlterField(
            model_name='adminprofile',
            name='role',
            field=models.CharField(default='Administrator', max_length=100),
        ),
        migrations.AlterField(
            model_name='adminprofile',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]
