import time
import pandas as pd
import requests
from io import StringIO
from django.core.files.base import ContentFile
from django.shortcuts import render, redirect
from django.http import JsonResponse

from sklearn.feature_selection import SelectKBest, f_classif, RFE
from sklearn.decomposition import PCA
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder

from .forms import DatasetForm
from .models import Dataset, GAResult, BaselineResult
from .genetic_selector import GeneticFeatureSelector

# الصفحة الرئيسية
def home(request):
    return render(request, 'core/home.html')

# رفع البيانات من ملف أو رابط
def upload_dataset(request):
    if request.method == 'POST':
        form = DatasetForm(request.POST, request.FILES)
        if form.is_valid():
            url = form.cleaned_data.get('url')
            file = request.FILES.get('file')

            if url:
                try:
                    response = requests.get(url)
                    if response.status_code == 200:
                        content = response.content.decode('utf-8')
                        filename = url.split('/')[-1]
                        dataset = Dataset(name=filename)
                        dataset.file.save(filename, ContentFile(content))
                        dataset.save()
                        return redirect('upload_success')
                except Exception as e:
                    print("URL upload failed:", e)
            elif file:
                dataset = form.save(commit=False)
                dataset.name = dataset.file.name
                dataset.save()
                return redirect('upload_success')
    else:
        form = DatasetForm()
    return render(request, 'core/upload.html', {'form': form})

# معاينة البيانات
def preview_dataset(request):
    latest = Dataset.objects.latest('id')
    df = pd.read_csv(latest.file.path)

    num_rows = df.shape[0]
    num_features = df.shape[1]
    missing_values = df.isnull().sum()
    missing_summary = missing_values[missing_values > 0].to_dict()
    table_html = df.head().to_html(classes='table table-bordered', index=False)
    columns = df.columns.tolist()

    context = {
        'table': table_html,
        'num_rows': num_rows,
        'num_features': num_features,
        'missing_summary': missing_summary,
        'columns': columns,
        'dataset_id': latest.id
    }
    return render(request, 'core/preview.html', context)

# تشغيل الخوارزمية الجينية
def run_genetic_algorithm(request, dataset_id):
    dataset = Dataset.objects.get(id=dataset_id)
    df = pd.read_csv(dataset.file.path)

    target_col = request.POST.get('target_column') if request.method == 'POST' else df.columns[-1]

    if GAResult.objects.filter(dataset_name=dataset.name).exists():
        return redirect('genetic_preview')

    for col in df.columns:
        if df[col].dtype == 'object':
            df[col] = LabelEncoder().fit_transform(df[col].astype(str))

    X = df.drop(columns=[target_col]).values
    y = df[target_col].values

    start = time.time()
    selector = GeneticFeatureSelector(X, y, population_size=10, generations=20)
    best_chromosome, best_accuracy = selector.evolve()
    end = time.time()

    selected_features = [df.drop(columns=[target_col]).columns[i] for i, gene in enumerate(best_chromosome) if gene == 1]

    GAResult.objects.create(
        dataset_name=dataset.name,
        selected_features=", ".join(selected_features),
        accuracy=best_accuracy,
        execution_time=round(end - start, 2),
        num_generations=selector.generations,
        population_size=selector.population_size,
        selected_count=selector.selected_count,
        selection_ratio=selector.selection_ratio
    )

    return redirect('genetic_preview')

# تشغيل الطرق التقليدية
def run_baseline_models(request, dataset_id):
    dataset = Dataset.objects.get(id=dataset_id)
    df = pd.read_csv(dataset.file.path)

    target_col = request.POST.get('target_column') if request.method == 'POST' else df.columns[-1]

    if BaselineResult.objects.filter(dataset_name=dataset.name).exists():
        return redirect('baseline_preview')

    for col in df.columns:
        if df[col].dtype == 'object':
            df[col] = LabelEncoder().fit_transform(df[col].astype(str))

    X = df.drop(columns=[target_col]).values
    y = df[target_col].values

    methods = {
        'SelectKBest': SelectKBest(score_func=f_classif, k='all'),
        'PCA': PCA(n_components=min(3, X.shape[1])),
        'RFE': RFE(estimator=LogisticRegression(), n_features_to_select=min(3, X.shape[1]))
    }

    for name, model in methods.items():
        start = time.time()
        model.fit(X, y)
        end = time.time()

        if hasattr(model, 'get_support'):
            selected = df.drop(columns=[target_col]).columns[model.get_support()]
        elif hasattr(model, 'components_'):
            selected = [f'PC{i+1}' for i in range(model.n_components)]
        else:
            selected = []

        BaselineResult.objects.create(
            dataset_name=dataset.name,
            method_name=name,
            selected_features=", ".join(selected),
            accuracy=round(model.score(X, y), 4),
            execution_time=round(end - start, 2)
        )

    return redirect('baseline_preview')

# عرض نتائج الجينية
def genetic_preview(request):
    results = GAResult.objects.all().order_by('-id')[:5]
    for r in results:
        r.selected_list = r.selected_features.split(', ')
        try:
            df = Dataset.objects.get(name=r.dataset_name)
            columns = pd.read_csv(df.file.path).columns[:-1]
            r.unselected_list = [col for col in columns if col not in r.selected_list]
        except:
            r.unselected_list = []
    return render(request, 'core/genetic_preview.html', {'results': results})

# عرض نتائج الطرق التقليدية
def baseline_preview(request):
    results = BaselineResult.objects.all().order_by('-id')[:10]
    return render(request, 'core/baseline_preview.html', {'results': results})

# عرض صفحة المقارنة
def comparison_view(request):
    latest_dataset = Dataset.objects.latest('id')
    ga_result = GAResult.objects.filter(dataset_name=latest_dataset.name).last()
    baseline_results = BaselineResult.objects.filter(dataset_name=latest_dataset.name)

    context = {
        'dataset_name': latest_dataset.name,
        'ga_result': ga_result,
        'baseline_results': baseline_results
    }
    return render(request, 'core/comparison.html', context)

# API: قائمة الملفات
def list_uploaded_files(request):
    files = Dataset.objects.all().order_by('-id')
    file_list = [ds.name for ds in files]
    return JsonResponse({'files': file_list})

# API: نتائج الطرق التقليدية
def get_baseline_results(request):
    file_name = request.GET.get('file')
    if not file_name:
        return JsonResponse({'error': 'Missing file name'}, status=400)

    try:
        results = BaselineResult.objects.filter(dataset_name=file_name)
        if not results.exists():
            return JsonResponse({'error': 'No baseline results found'}, status=404)

        formatted = []
        for r in results:
            formatted.append({
                'method': r.method_name,
                'selectedFeatures': r.selected_features.split(', '),
                'accuracy': round(r.accuracy, 4),
                'executionTime': r.execution_time
            })

        return JsonResponse({'dataset': file_name, 'results': formatted})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# API: نتائج الجينية
def get_genetic_results(request):
    file_name = request.GET.get('file')
    if not file_name:
        return JsonResponse({'error': 'Missing file name'}, status=400)

    try:
        result = GAResult.objects.filter(dataset_name=file_name).last()
        if not result:
            return JsonResponse({'error': 'No results found'}, status=404)

        return JsonResponse({
            'dataset': result.dataset_name,
            'selectedFeatures': result.selected_features.split(', '),
            'accuracy': round(result.accuracy, 4),
            'executionTime': result.execution_time,
            'generations': result.num_generations,
            'populationSize': result.population_size,
            'selectionRatio': result.selection_ratio,
            'selectedCount': result.selected_count
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)