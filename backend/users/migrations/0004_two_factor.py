# Generated migration for 2FA

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_email_verification'), 
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='two_factor_secret',
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='is_two_factor_enabled',
            field=models.BooleanField(default=False),
        ),
    ]
