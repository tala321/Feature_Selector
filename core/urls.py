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
)

urlpatterns = [
    # Home page
    path('', home, name='home'),

 
    path('upload/', upload_dataset, name='upload_dataset'),
    path('upload/success/', lambda request: render(request, 'core/success.html'), name='upload_success'),

    # Preview latest uploaded dataset
    path('preview/', preview_dataset, name='preview_dataset'),

    # Run genetic algorithm on specific dataset by ID
    path('run-genetic/<int:dataset_id>/', run_genetic_algorithm, name='run_genetic'),

    # Run baseline models on specific dataset by ID
    path('run-baseline/<int:dataset_id>/', run_baseline_models, name='run_baseline'),

    # Show latest genetic algorithm results
    path('genetic-preview/', genetic_preview, name='genetic_preview'),

    # Show latest baseline model results
    path('baseline-preview/', baseline_preview, name='baseline_preview'),
]