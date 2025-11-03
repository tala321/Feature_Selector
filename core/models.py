from django.db import models

class Dataset(models.Model):
    name = models.CharField(max_length=255, default='default_dataset')
    file = models.FileField(upload_to='datasets/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Dataset"
        verbose_name_plural = "Datasets"
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.name


class GAResult(models.Model):
    dataset_name = models.CharField(max_length=255)
    target_column = models.CharField(max_length=255)
    selected_features = models.TextField()
    irrelevant_features = models.TextField(blank=True, null=True)
    accuracy = models.FloatField()
    generations = models.IntegerField()
    population_size = models.IntegerField()
    execution_time = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Genetic Algorithm Result"
        verbose_name_plural = "Genetic Algorithm Results"
        ordering = ['-created_at']

    def __str__(self):
        return f"GAResult for {self.dataset_name} ({self.target_column})"

    @property
    def selected_list(self):
        return [f.strip() for f in self.selected_features.split(',') if f.strip()]

    @property
    def unselected_list(self):
        return [f.strip() for f in self.irrelevant_features.split(',') if f.strip()]

    @property
    def selected_count(self):
        return len(self.selected_list)

    @property
    def selection_ratio(self):
        total = len(self.selected_list) + len(self.unselected_list)
        return f"{len(self.selected_list)}/{total}" if total > 0 else "0/0"

    @property
    def num_generations(self):
        return self.generations


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
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.dataset_name} | {self.method_name} | Accuracy: {self.accuracy:.2f}"

    @property
    def selected_list(self):
        return [f.strip() for f in self.selected_features.split(',') if f.strip()]