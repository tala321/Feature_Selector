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
from .models import Dataset, BaselineResult

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

# تشغيل الخوارزمية الجينية (نموذج مبدئي)
def run_genetic(request, dataset_id):
    dataset = Dataset.objects.get(id=dataset_id)
    target_col = request.POST.get('target_column') or dataset.file.name

    data = {
        "dataset": dataset.name,
        "target_column": target_col,
        "selected_features": ["feature1", "feature2", "feature3"],
        "accuracy": 0.91,
        "generations": 50,
        "population_size": 100,
        "irrelevant_features": ["featureX", "featureY"]
    }
    return JsonResponse(data)

# تشغيل الطرق التقليدية
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.utils.multiclass import type_of_target

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

    label_type = type_of_target(y)
    is_classification = label_type in ['binary', 'multiclass']

    methods = {
        'SelectKBest': SelectKBest(score_func=f_classif, k='all'),
        'PCA': PCA(n_components=min(3, X.shape[1])),
        'RFE': RFE(estimator=LogisticRegression() if is_classification else LinearRegression(), n_features_to_select=min(3, X.shape[1]))
    }

    for name, model in methods.items():
        start = time.time()
        model.fit(X, y)
        end = time.time()

        if hasattr(model, 'get_support'):
            selected = df.drop(columns=[target_col]).columns[model.get_support()]
            selected_X = X[:, model.get_support()]
        elif hasattr(model, 'components_'):
            selected = [f'PC{i+1}' for i in range(model.n_components)]
            selected_X = model.transform(X)
        else:
            selected = []
            selected_X = X

        clf = LogisticRegression() if is_classification else LinearRegression()
        clf.fit(selected_X, y)
        accuracy = clf.score(selected_X, y)

        BaselineResult.objects.create(
            dataset_name=dataset.name,
            method_name=name,
            selected_features=", ".join(selected),
            accuracy=round(accuracy, 4),
            execution_time=round(end - start, 2)
        )

    return redirect('baseline_preview')

# عرض نتائج الطرق التقليدية
def baseline_preview(request):
    results = BaselineResult.objects.all().order_by('-id')[:10]
    dataset_list = Dataset.objects.all()
    return render(request, 'core/baseline_preview.html', {
        'results': results,
        'dataset_list': {d.name: d for d in dataset_list}
    })

# عرض صفحة المقارنة
def comparison_view(request):
    latest_dataset = Dataset.objects.latest('id')
    baseline_results = BaselineResult.objects.filter(dataset_name=latest_dataset.name)

    # نتائج الجينية (نموذج مبدئي)
    genetic_result = {
        "selected_features": ["feature1", "feature2", "feature3"],
        "accuracy": 0.91,
        "execution_time": 0.05,
        "method_name": "Genetic Algorithm"
    }

    context = {
        'dataset_name': latest_dataset.name,
        'baseline_results': baseline_results,
        'genetic_result': genetic_result
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