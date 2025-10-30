from django.contrib import admin
from .models import Dataset, GAResult, BaselineResult

@admin.register(Dataset)
class DatasetAdmin(admin.ModelAdmin):
    list_display = ['name', 'file', 'uploaded_at']
    search_fields = ['name']
    readonly_fields = ['uploaded_at']
    ordering = ['-uploaded_at']

@admin.register(GAResult)
class GAResultAdmin(admin.ModelAdmin):
    list_display = ['dataset_name', 'formatted_accuracy', 'formatted_execution_time', 'created_at']
    search_fields = ['dataset_name']
    readonly_fields = ['created_at']
    ordering = ['-created_at']

    def formatted_accuracy(self, obj):
        return f"{obj.accuracy:.2%}"
    formatted_accuracy.short_description = "Accuracy"

    def formatted_execution_time(self, obj):
        return f"{obj.execution_time:.2f} seconds"
    formatted_execution_time.short_description = "Execution Time"

@admin.register(BaselineResult)
class BaselineResultAdmin(admin.ModelAdmin):
    list_display = ['dataset_name', 'method_name', 'formatted_accuracy', 'formatted_execution_time', 'created_at']
    search_fields = ['dataset_name', 'method_name']
    readonly_fields = ['created_at']
    ordering = ['-created_at']

    def formatted_accuracy(self, obj):
        return f"{obj.accuracy:.2%}"
    formatted_accuracy.short_description = "Accuracy"

    def formatted_execution_time(self, obj):
        return f"{obj.execution_time:.2f} seconds"
    formatted_execution_time.short_description = "Execution Time"