# Generated migration for admin review fields

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0006_booking_current_notified_driver_alter_booking_status'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='rating',
            name='admin_response',
            field=models.TextField(blank=True, help_text="Admin's response/notes to the rating", null=True),
        ),
        migrations.AddField(
            model_name='rating',
            name='flag_reason',
            field=models.CharField(blank=True, help_text='Reason for flagging', max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='rating',
            name='is_flagged',
            field=models.BooleanField(default=False, help_text='Flag for inappropriate or problematic ratings'),
        ),
        migrations.AddField(
            model_name='rating',
            name='is_reviewed_by_admin',
            field=models.BooleanField(default=False, help_text='Whether admin has reviewed this rating'),
        ),
        migrations.AddField(
            model_name='rating',
            name='reviewed_at',
            field=models.DateTimeField(blank=True, help_text='When admin reviewed this rating', null=True),
        ),
        migrations.AddField(
            model_name='rating',
            name='reviewed_by',
            field=models.ForeignKey(blank=True, help_text='Admin who reviewed the rating', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_ratings', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterModelOptions(
            name='rating',
            options={'ordering': ['-created_at']},
        ),
    ]
