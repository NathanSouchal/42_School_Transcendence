# Generated by Django 5.1.3 on 2025-01-09 12:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='match_history',
            field=models.ManyToManyField(blank=True, null=True, related_name='match_history', to='api.game'),
        ),
    ]
