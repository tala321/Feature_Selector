from django.urls import path
from django.shortcuts import render
from . import views
from .views import (
    home,
    upload_dataset,
    preview_dataset,
    run_baseline_models,
    run_genetic,
    baseline_preview,
    comparison_view,
    list_uploaded_files,
    get_baseline_results,
)

urlpatterns = [
    path('', home, name='home'),
    path('upload/', upload_dataset, name='upload_dataset'),
    path('upload/success/', lambda request: render(request, 'core/success.html'), name='upload_success'),
    path('preview/', preview_dataset, name='preview_dataset'),
    path('run-baseline/<int:dataset_id>/', run_baseline_models, name='run_baseline'),
    path('run-genetic/<int:dataset_id>/', run_genetic, name='run_genetic'),
    path('baseline-preview/', baseline_preview, name='baseline_preview'),
    path('traditional-results/', baseline_preview, name='traditional_results'),
    path('genetic-results/', lambda request: render(request, 'core/genetic_preview.html'), name='genetic_results'),
    path('compare/', comparison_view, name='comparison_view'),
    path('readme/', lambda request: render(request, 'core/readme.html'), name='readme'),
    path('results/traditional/', get_baseline_results, name='get_baseline_results'),
    path('files/', list_uploaded_files, name='list_uploaded_files'),
    
]