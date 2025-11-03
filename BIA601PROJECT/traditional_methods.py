import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import Lasso, LinearRegression
from sklearn.feature_selection import SelectKBest, f_regression
from sklearn.metrics import mean_squared_error
import time


# --Load data and identify target column--
data = pd.read_csv("data/student_exam_scores.csv")
target_column = data.columns[-1]  # Select the last column as target
print(f"Target column has been identified:  {target_column}")


# --Convert categorical/text data to numeric--
encoder = LabelEncoder()
for col in data.columns:
    if data[col].dtype == 'object':
        data[col] = encoder.fit_transform(data[col].astype(str))


# --Separate features (X) and target (y)--
X = data.drop(columns=[target_column])
y = data[target_column]

# --Define fitness function (model performance)--
def CalculateFitness(y_true, y_pred):
    # Calculate model error using Mean Squared Error (MSE)
    mse = mean_squared_error(y_true, y_pred)
    return mse 


results = {} 

# ---Apply Lasso Regression---

start = time.time()
lasso_model = Lasso(alpha=0.001, max_iter=10000)
lasso_model.fit(X, y)
y_pred_lasso = lasso_model.predict(X)
mse_lasso = CalculateFitness(y, y_pred_lasso) # Evaluate performance using the fitness function
selected_features_lasso = X.columns[abs(lasso_model.coef_) > 0].tolist() # Important features
end = time.time()

# Store results for this method
results["Lasso Regression"] = {
    "mse": mse_lasso,
    "selected_features": selected_features_lasso,
    "execution_time": end - start
}



# ---Apply SelectKBest + f_regression---

k = min(5, X.shape[1]) # Choose top 5 best features (or fewer if dataset has less than 5)
start = time.time()
# Select features with highest correlation to the target using F-test
selector = SelectKBest(score_func=f_regression, k=k)
X_selected = selector.fit_transform(X, y)
selected_features_freg = X.columns[selector.get_support()].tolist() # Get the names of the selected features

# Train a simple regression model using the selected features
reg_model = LinearRegression()
reg_model.fit(X[selected_features_freg], y)
y_pred_freg = reg_model.predict(X[selected_features_freg])
mse_freg = CalculateFitness(y, y_pred_freg) # Evaluate model performance using the fitness function (MSE)
end = time.time()

# Store results for this method
results["SelectKBest (f_regression)"] = {
    "mse": mse_freg,
    "selected_features": selected_features_freg,
    "execution_time": end - start
}



# --Display final results--
print("\n Final results of the traditional methods:\n")
for method, info in results.items():
    print(f"-- {method} --")
    print(f"   MSE: {info['mse']:.4f}")
    print(f"   Execution Time: {info['execution_time']:.4f} s")
    print(f"   Selected Features: {info['selected_features']}\n")
