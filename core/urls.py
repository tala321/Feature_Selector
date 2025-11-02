from django.urls import path
from django.shortcuts import render
from .views import (
    home,
    upload_dataset,
    preview_dataset,
    genetic_preview,
    run_genetic_algorithm,
    run_baseline_models,
    baseline_preview,
    comparison_view,
    list_uploaded_files,
    get_genetic_results,
    get_baseline_results,
)

urlpatterns = [
    path('', home, name='home'),
    path('upload/', upload_dataset, name='upload_dataset'),
    path('upload/success/', lambda request: render(request, 'core/success.html'), name='upload_success'),
    path('preview/', preview_dataset, name='preview_dataset'),
    path('run-genetic/<int:dataset_id>/', run_genetic_algorithm, name='run_genetic'),
    path('run-baseline/<int:dataset_id>/', run_baseline_models, name='run_baseline'),
    path('genetic-preview/', genetic_preview, name='genetic_preview'),
    path('baseline-preview/', baseline_preview, name='baseline_preview'),
    path('compare/', comparison_view, name='comparison_view'),
    path('readme/', lambda request: render(request, 'core/readme.html'), name='readme'),

    #  API endpoints
    path('results/genetic/', get_genetic_results, name='get_genetic_results'),
    path('results/traditional/', get_baseline_results, name='get_baseline_results'),
    path('files/', list_uploaded_files, name='list_uploaded_files'),

    #  Frontend result pages (used in success.html)
    path('genetic-results/', genetic_preview, name='genetic_results'),
    path('traditional-results/', baseline_preview, name='traditional_results'),
]