# Generated by Django 5.1.3 on 2025-02-26 08:35

import api.models.user_model
import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('username', models.CharField(max_length=100, unique=True)),
                ('alias', models.CharField(max_length=100, null=True, unique=True)),
                ('avatar', models.ImageField(blank=True, null=True, upload_to=api.models.user_model.file_location)),
                ('is_active', models.BooleanField(default=True)),
                ('is_staff', models.BooleanField(default=False)),
                ('two_factor_method', models.CharField(blank=True, choices=[('email', 'Email'), ('sms', 'SMS'), ('TOTP', 'Google Authenticator'), ('none', 'None')], help_text='2FA method choosed by user', max_length=10, null=True)),
                ('email_otp', models.CharField(blank=True, max_length=6, null=True)),
                ('sms_otp', models.CharField(blank=True, max_length=6, null=True)),
                ('phone_number', models.CharField(blank=True, help_text='Required for SMS 2FA', max_length=15, null=True)),
                ('email', models.CharField(blank=True, help_text='Required for Email 2FA', max_length=50, null=True)),
                ('otp_created_at', models.DateTimeField(blank=True, help_text='Time when OTP was generated', null=True)),
                ('totp_secret', models.CharField(blank=True, max_length=32, null=True)),
                ('friends', models.ManyToManyField(blank=True, to=settings.AUTH_USER_MODEL)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Game',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('score_player1', models.IntegerField(default=0)),
                ('score_player2', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('player1', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='games_as_player1', to=settings.AUTH_USER_MODEL)),
                ('player2', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='games_as_player2', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='user',
            name='match_history',
            field=models.ManyToManyField(blank=True, related_name='match_history', to='api.game'),
        ),
        migrations.CreateModel(
            name='RefreshToken',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='refresh_token', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Stats',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('wins', models.PositiveIntegerField(default=0)),
                ('losses', models.PositiveIntegerField(default=0)),
                ('win_ratio', models.FloatField(blank=True, null=True)),
                ('nb_games', models.PositiveIntegerField(default=0)),
                ('average_score', models.PositiveIntegerField(default=0)),
                ('last_game', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.game')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='stats', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='user',
            name='user_stats',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='stats_user', to='api.stats'),
        ),
        migrations.CreateModel(
            name='Tournament',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(default='unnamed', max_length=100, unique=True)),
                ('participants', models.JSONField(blank=True, default=list)),
                ('status', models.CharField(default='not_started', max_length=20)),
                ('number_of_players', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('rounds_tree', models.JSONField(blank=True, default=list)),
                ('creator', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Match',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('round_number', models.PositiveIntegerField(default=1)),
                ('player1', models.CharField(blank=True, max_length=50, null=True)),
                ('player2', models.CharField(blank=True, max_length=50, null=True)),
                ('winner', models.CharField(blank=True, max_length=50, null=True)),
                ('score_player1', models.PositiveIntegerField(default=0)),
                ('score_player2', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('next_match', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='previous_matches', to='api.match')),
                ('tournament', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matches', to='api.tournament')),
            ],
        ),
        migrations.CreateModel(
            name='FriendRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('accepted', models.BooleanField(default=False)),
                ('from_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='friend_request_sent', to=settings.AUTH_USER_MODEL)),
                ('to_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='friend_request_received', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'constraints': [models.UniqueConstraint(fields=('from_user', 'to_user'), name='unique_friend_request'), models.UniqueConstraint(fields=('to_user', 'from_user'), name='unique_reverse_friend_request')],
            },
        ),
    ]
