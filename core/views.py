import time
import pandas as pd
import requests
from io import StringIO
from django.core.files.base import ContentFile
from django.shortcuts import render, redirect
from sklearn.feature_selection import SelectKBest, f_classif, RFE
from sklearn.decomposition import PCA
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

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

    context = {
        'table': table_html,
        'num_rows': num_rows,
        'num_features': num_features,
        'missing_summary': missing_summary,
    }
    return render(request, 'core/preview.html', context)

# عرض نتائج الخوارزمية الجينية
def genetic_preview(request):
    results = GAResult.objects.all().order_by('-id')[:5]
    return render(request, 'core/genetic_preview.html', {'results': results})

# تشغيل الخوارزمية الجينية على ملف محدد
def run_genetic_algorithm(request, dataset_id):
    dataset = Dataset.objects.get(id=dataset_id)
    df = pd.read_csv(dataset.file.path)

    if GAResult.objects.filter(dataset_name=dataset.name).exists():
        return redirect('genetic_preview')

    target_col = df.columns[-1]
    X = df.drop(columns=[target_col]).values
    y = df[target_col].values

    start = time.time()
    selector = GeneticFeatureSelector(X, y, population_size=10, generations=20)
    best_chromosome, best_accuracy = selector.evolve()
    end = time.time()

    selected_features = [df.columns[i] for i, gene in enumerate(best_chromosome) if gene == 1]

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

# تشغيل الطرق التقليدية على ملف محدد
def run_baseline_models(request, dataset_id):
    dataset = Dataset.objects.get(id=dataset_id)
    df = pd.read_csv(dataset.file.path)

    if BaselineResult.objects.filter(dataset_name=dataset.name).exists():
        return redirect('baseline_preview')

    target_col = df.columns[-1]
    X = df.drop(columns=[target_col])
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
    model = DecisionTreeClassifier()

    methods = {
        'SelectKBest': SelectKBest(score_func=f_classif, k=3),
        'PCA': PCA(n_components=3),
        'RFE': RFE(estimator=model, n_features_to_select=3)
    }

    for method_name, selector in methods.items():
        start = time.time()
        selected_X = selector.fit_transform(X_train, y_train)
        model.fit(selected_X, y_train)

        selected_test = selector.transform(X_test)
        predictions = model.predict(selected_test)
        accuracy = accuracy_score(y_test, predictions)
        end = time.time()

        try:
            if hasattr(selector, 'get_support'):
                selected_features = X.columns[selector.get_support()].tolist()
            else:
                selected_features = [f"PC{i+1}" for i in range(selected_X.shape[1])]
        except:
            selected_features = ["Unknown"]

        BaselineResult.objects.create(
            dataset_name=dataset.name,
            method_name=method_name,
            selected_features=", ".join(selected_features),
            accuracy=accuracy,
            execution_time=round(end - start, 2)
        )

    return redirect('baseline_preview')

# عرض نتائج الطرق التقليدية
def baseline_preview(request):
    results = BaselineResult.objects.all().order_by('-id')[:10]
    return render(request, 'core/baseline_preview.html', {'results': results})