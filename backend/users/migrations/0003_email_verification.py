# Generated migration for email verification

from django.db import migrations, models
import uuid

def generate_unique_tokens(apps, schema_editor):
    User = apps.get_model('users', 'User')
    for user in User.objects.all():
        user.email_verification_token = uuid.uuid4()
        user.save(update_fields=['email_verification_token'])

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_user_is_online'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_email_verified',
            field=models.BooleanField(default=False),
        ),
        # Add as nullable first
        migrations.AddField(
            model_name='user',
            name='email_verification_token',
            field=models.UUIDField(default=uuid.uuid4, null=True),
        ),
        # Generate tokens for existing users
        migrations.RunPython(generate_unique_tokens, reverse_code=migrations.RunPython.noop),
        # Now make it unique and non-nullable
        migrations.AlterField(
            model_name='user',
            name='email_verification_token',
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AddField(
            model_name='user',
            name='token_created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
    ]

