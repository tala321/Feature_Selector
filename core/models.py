from django.db import models

class Dataset(models.Model):
    name = models.CharField(max_length=255, default='default_dataset')
    file = models.FileField(upload_to='datasets/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Dataset"
        verbose_name_plural = "Datasets"

    def __str__(self):
        return self.name


class GAResult(models.Model):
    dataset_name = models.CharField(max_length=255)
    selected_features = models.TextField()
    accuracy = models.FloatField()
    execution_time = models.FloatField()
    num_generations = models.IntegerField(default=20)
    population_size = models.IntegerField(default=10)
    selected_count = models.IntegerField(default=0)
    selection_ratio = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Genetic Algorithm Result"
        verbose_name_plural = "Genetic Algorithm Results"

    def __str__(self):
        return f"{self.dataset_name} | GA Accuracy: {self.accuracy:.2f}"


class BaselineResult(models.Model):
    dataset_name = models.CharField(max_length=255)
    method_name = models.CharField(max_length=100)
    selected_features = models.TextField()
    accuracy = models.FloatField()
    execution_time = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Baseline Model Result"
        verbose_name_plural = "Baseline Model Results"

    def __str__(self):
        return f"{self.dataset_name} | {self.method_name} | Accuracy: {self.accuracy:.2f}"