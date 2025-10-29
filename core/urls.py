from django.urls import path
from .views import upload_dataset, preview_dataset, genetic_preview, run_genetic_algorithm
from django.shortcuts import render

urlpatterns = [
    path('upload/', upload_dataset, name='upload_dataset'),
    path('upload/success/', lambda request: render(request, 'core/success.html'), name='upload_success'),
    path('preview/', preview_dataset, name='preview_dataset'),
    path('genetic-preview/', genetic_preview, name='genetic_preview'),
    path('run-genetic/', run_genetic_algorithm, name='run_genetic'),
]