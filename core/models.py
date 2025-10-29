from django.db import models

class Dataset(models.Model):
    name = models.CharField(max_length=255, default='default_dataset')
    file = models.FileField(upload_to='datasets/')

    def __str__(self):
        return self.name

class GAResult(models.Model):
    dataset_name = models.CharField(max_length=255)
    selected_features = models.TextField()
    accuracy = models.FloatField()
    execution_time = models.FloatField()

    def __str__(self):
        return f"{self.dataset_name} - دقة: {self.accuracy:.2f}"
    