from django import forms
from .models import Dataset

class DatasetForm(forms.ModelForm):
    url = forms.URLField(
        required=False,
        label="Upload from URL",
        widget=forms.URLInput(attrs={
            'class': 'form-control',
            'placeholder': 'Paste CSV file URL here'
        })
    )

    file = forms.FileField(
        required=False,
        label="Upload from Device",
        widget=forms.ClearableFileInput(attrs={
            'class': 'form-control'
        })
    )

    class Meta:
        model = Dataset
        fields = ['file', 'url']