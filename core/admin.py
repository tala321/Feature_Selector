from django.contrib import admin
from .models import Dataset

class DatasetAdmin(admin.ModelAdmin):
    list_display = ['name', 'file']  # فقط الحقول الموجودة فعليًا

admin.site.register(Dataset, DatasetAdmin)