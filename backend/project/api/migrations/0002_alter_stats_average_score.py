# Generated by Django 5.1.3 on 2025-03-06 12:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='stats',
            name='average_score',
            field=models.FloatField(default=0.0),
        ),
    ]
